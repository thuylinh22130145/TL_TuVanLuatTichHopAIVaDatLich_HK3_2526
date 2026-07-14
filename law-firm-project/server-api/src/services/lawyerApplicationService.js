import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import { LawyerApplication, Lawyer, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export async function createLawyerApplication(payload) {
  return sequelize.transaction(async (transaction) => {
    const { username, password, ...application } = payload;
    let user;

    if (application.user_id) {
      user = await User.findByPk(application.user_id, { transaction });
      if (!user || user.email.toLowerCase() !== application.email) {
        throw new ApiError(400, 'Tài khoản và email đăng ký không khớp.');
      }
    } else {
      if (await User.findOne({ where: { email: application.email }, transaction })) {
        throw new ApiError(409, 'Email đã có tài khoản. Vui lòng đăng nhập trước khi gửi hồ sơ.');
      }
      if (await User.findOne({ where: { username }, transaction })) {
        throw new ApiError(409, 'Tên đăng nhập đã được sử dụng.');
      }

      user = await User.create({
        username,
        email: application.email,
        password_hash: await bcrypt.hash(password, 10),
        full_name: application.full_name,
        phone: application.phone,
        role: 'USER',
        status: 'ACTIVE',
      }, { transaction });
    }

    if (await LawyerApplication.findOne({
      where: { user_id: user.id, status: 'pending' },
      transaction,
    })) {
      throw new ApiError(409, 'Tài khoản này đã có hồ sơ đang chờ duyệt.');
    }

    const duplicateCredential = await LawyerApplication.findOne({
      where: {
        status: { [Op.in]: ['pending', 'approved'] },
        [Op.or]: [
          { license_number: application.license_number },
          { citizen_id: application.citizen_id },
        ],
      },
      transaction,
    });

    if (duplicateCredential) {
      throw new ApiError(409, 'Số thẻ luật sư hoặc CCCD đã được dùng trong một hồ sơ khác.');
    }

    return LawyerApplication.create({ ...application, user_id: user.id }, { transaction });
  });
}

export async function listLawyerApplications(filter = {}) {
  return LawyerApplication.findAll({
    where: filter,
    order: [['created_at', 'DESC']],
  });
}

export async function getLawyerApplicationById(id) {
  const application = await LawyerApplication.findByPk(id);
  if (!application) throw new ApiError(404, 'Không tìm thấy hồ sơ đăng ký luật sư.');
  return application;
}

export async function approveLawyerApplication(id, reviewerId, review_note = null) {
  return sequelize.transaction(async (transaction) => {
    const application = await LawyerApplication.findByPk(id, { transaction });
    if (!application) throw new ApiError(404, 'Không tìm thấy hồ sơ đăng ký luật sư.');
    if (application.status !== 'pending') throw new ApiError(400, 'Hồ sơ đã được xử lý trước đó.');

    const user = application.user_id
      ? await User.findByPk(application.user_id, { transaction })
      : await User.findOne({ where: { email: application.email }, transaction });

    if (!user) throw new ApiError(400, 'Không tìm thấy tài khoản ứng viên để kích hoạt vai trò luật sư.');

    if (user.role !== 'LAWYER') {
      user.role = 'LAWYER';
      await user.save({ transaction });
    }

    const lawyerPayload = {
      user_id: user.id,
      full_name: application.full_name || user.full_name,
      title: 'Luật sư',
      email: application.email,
      phone: application.phone,
      bio: application.message || null,
      specialization: application.specialization,
      experience_years: application.experience_years || 0,
      status: 'active',
    };

    const existingLawyer = await Lawyer.findOne({ where: { user_id: user.id }, transaction });
    if (existingLawyer) await existingLawyer.update(lawyerPayload, { transaction });
    else await Lawyer.create(lawyerPayload, { transaction });

    await application.update({
      status: 'approved',
      reviewed_by: reviewerId || null,
      reviewed_at: new Date(),
      review_note,
    }, { transaction });

    return application;
  });
}

export async function rejectLawyerApplication(id, reviewerId, review_note = null) {
  const application = await getLawyerApplicationById(id);
  if (application.status !== 'pending') throw new ApiError(400, 'Hồ sơ đã được xử lý trước đó.');

  await application.update({
    status: 'rejected',
    reviewed_by: reviewerId || null,
    reviewed_at: new Date(),
    review_note,
  });
  return application;
}