import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import { LawyerApplication, Lawyer, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { sendLawyerApplicationDecision } from './emailService.js';

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

async function sendDecisionNotification(application) {
  try {
    await sendLawyerApplicationDecision({
      email: application.email,
      fullName: application.full_name,
      status: application.status,
      reviewNote: application.review_note,
    });
    return true;
  } catch (error) {
    console.error(
      '[Lawyer Application] Đã cập nhật hồ sơ nhưng không gửi được email:',
      error.message
    );
    return false;
  }
}

export async function approveLawyerApplication(id, reviewerId, review_note = null) {
  const application = await sequelize.transaction(async (transaction) => {
    const row = await LawyerApplication.findByPk(id, { transaction });
    if (!row) throw new ApiError(404, 'Không tìm thấy hồ sơ đăng ký luật sư.');
    if (row.status !== 'pending') throw new ApiError(400, 'Hồ sơ đã được xử lý trước đó.');

    const user = row.user_id
      ? await User.findByPk(row.user_id, { transaction })
      : await User.findOne({ where: { email: row.email }, transaction });

    if (!user) throw new ApiError(400, 'Không tìm thấy tài khoản ứng viên để kích hoạt vai trò luật sư.');

    if (user.role !== 'LAWYER') {
      user.role = 'LAWYER';
      await user.save({ transaction });
    }

    const lawyerPayload = {
      user_id: user.id,
      full_name: row.full_name || user.full_name,
      title: 'Luật sư',
      email: row.email,
      phone: row.phone,
      bio: row.message || null,
      specialization: row.specialization,
      experience_years: row.experience_years || 0,
      status: 'active',
    };

    const existingLawyer = await Lawyer.findOne({
      where: { user_id: user.id },
      transaction,
    });
    if (existingLawyer) {
      await existingLawyer.update(lawyerPayload, { transaction });
    } else {
      await Lawyer.create(lawyerPayload, { transaction });
    }

    await row.update({
      status: 'approved',
      reviewed_by: reviewerId || null,
      reviewed_at: new Date(),
      review_note,
    }, { transaction });

    return row;
  });

  const email_sent = await sendDecisionNotification(application);
  return { application, email_sent };
}

export async function rejectLawyerApplication(id, reviewerId, review_note = null) {
  const application = await sequelize.transaction(async (transaction) => {
    const row = await LawyerApplication.findByPk(id, { transaction });
    if (!row) throw new ApiError(404, 'Không tìm thấy hồ sơ đăng ký luật sư.');
    if (row.status !== 'pending') throw new ApiError(400, 'Hồ sơ đã được xử lý trước đó.');

    await row.update({
      status: 'rejected',
      reviewed_by: reviewerId || null,
      reviewed_at: new Date(),
      review_note,
    }, { transaction });
    return row;
  });

  const email_sent = await sendDecisionNotification(application);
  return { application, email_sent };
}
