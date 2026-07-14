import { Booking, Lawyer, LawyerSchedule, LegalCategory, User } from '../models/index.js';
import { sequelize } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

const profileInclude = [
  { model: User, as: 'user', attributes: ['id', 'username', 'email', 'full_name', 'phone', 'avatar_url', 'status'] },
  { model: LegalCategory, as: 'categories', attributes: ['id', 'name', 'slug'], through: { attributes: [] }, required: false },
];

async function findLawyer(userId, options = {}) {
  const lawyer = await Lawyer.findOne({ where: { user_id: userId }, ...options });
  if (!lawyer) throw new ApiError(404, 'Không tìm thấy hồ sơ luật sư.');
  return lawyer;
}

export async function getPortalProfile(userId) {
  const lawyer = await findLawyer(userId, { include: profileInclude });
  const [total, pending, confirmed, completed] = await Promise.all([
    Booking.count({ where: { lawyer_id: lawyer.id } }),
    Booking.count({ where: { lawyer_id: lawyer.id, status: 'PENDING' } }),
    Booking.count({ where: { lawyer_id: lawyer.id, status: 'CONFIRMED' } }),
    Booking.count({ where: { lawyer_id: lawyer.id, status: 'COMPLETED' } }),
  ]);
  return { lawyer, statistics: { total, pending, confirmed, completed } };
}

export async function updatePortalProfile(userId, payload) {
  await sequelize.transaction(async (transaction) => {
    const lawyer = await findLawyer(userId, { transaction });
    const user = await User.findByPk(userId, { transaction });
    const lawyerChanges = {};
    const userChanges = {};

    for (const field of ['title', 'bio', 'specialization', 'experience_years', 'availability_status', 'avatar_url']) {
      if (payload[field] !== undefined) lawyerChanges[field] = payload[field];
    }
    for (const field of ['full_name', 'phone', 'avatar_url']) {
      if (payload[field] !== undefined) userChanges[field] = payload[field];
    }
    if (payload.full_name !== undefined) lawyerChanges.full_name = payload.full_name;
    if (payload.phone !== undefined) lawyerChanges.phone = payload.phone;

    await user.update(userChanges, { transaction });
    await lawyer.update(lawyerChanges, { transaction });
  });
  return getPortalProfile(userId);
}

export async function listSchedules(userId) {
  const lawyer = await findLawyer(userId);
  return LawyerSchedule.findAll({
    where: { lawyer_id: lawyer.id },
    order: [['day_of_week', 'ASC'], ['start_time', 'ASC']],
  });
}

function validateSchedules(items) {
  if (!Array.isArray(items)) throw new ApiError(400, 'Danh sách lịch làm việc không hợp lệ.');
  const normalized = items.map((item) => ({
    day_of_week: Number(item.day_of_week),
    start_time: String(item.start_time || '').slice(0, 5),
    end_time: String(item.end_time || '').slice(0, 5),
    is_available: item.is_available !== false,
  }));
  for (const item of normalized) {
    if (!Number.isInteger(item.day_of_week) || item.day_of_week < 0 || item.day_of_week > 6) {
      throw new ApiError(400, 'Ngày làm việc phải nằm trong khoảng 0 đến 6.');
    }
    if (!/^\d{2}:\d{2}$/.test(item.start_time) || !/^\d{2}:\d{2}$/.test(item.end_time) || item.start_time >= item.end_time) {
      throw new ApiError(400, 'Khoảng thời gian làm việc không hợp lệ.');
    }
  }
  for (let index = 0; index < normalized.length; index += 1) {
    for (let other = index + 1; other < normalized.length; other += 1) {
      const left = normalized[index];
      const right = normalized[other];
      if (left.day_of_week === right.day_of_week && left.start_time < right.end_time && left.end_time > right.start_time) {
        throw new ApiError(409, 'Các khung giờ làm việc không được trùng nhau.');
      }
    }
  }
  return normalized;
}

export async function replaceSchedules(userId, items) {
  const lawyer = await findLawyer(userId);
  const schedules = validateSchedules(items);
  await sequelize.transaction(async (transaction) => {
    await LawyerSchedule.destroy({ where: { lawyer_id: lawyer.id }, transaction });
    if (schedules.length) {
      await LawyerSchedule.bulkCreate(
        schedules.map((item) => ({ ...item, lawyer_id: lawyer.id })),
        { transaction }
      );
    }
  });
  return listSchedules(userId);
}
