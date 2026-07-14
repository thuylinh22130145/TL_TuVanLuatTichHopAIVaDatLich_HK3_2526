import { Op } from 'sequelize';
import { Booking, LawDocument, Lawyer, LawyerApplication, LegalCategory, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export async function getOverview() {
  const [users, customers, lawyerAccounts, activeLawyers, pendingApplications, bookings, pendingBookings, confirmedBookings, completedBookings, categories, documents] = await Promise.all([
    User.count(),
    User.count({ where: { role: 'USER' } }),
    User.count({ where: { role: 'LAWYER' } }),
    Lawyer.count({ where: { status: 'active' } }),
    LawyerApplication.count({ where: { status: 'pending' } }),
    Booking.count(),
    Booking.count({ where: { status: 'PENDING' } }),
    Booking.count({ where: { status: 'CONFIRMED' } }),
    Booking.count({ where: { status: 'COMPLETED' } }),
    LegalCategory.count({ where: { status: 'ACTIVE' } }),
    LawDocument.count(),
  ]);

  const recentBookings = await Booking.findAll({
    include: [{ model: Lawyer, as: 'lawyer', attributes: ['id', 'full_name'] }],
    order: [['created_at', 'DESC']],
    limit: 6,
  });

  return {
    statistics: { users, customers, lawyerAccounts, activeLawyers, pendingApplications, bookings, pendingBookings, confirmedBookings, completedBookings, categories, documents },
    recentBookings,
  };
}

export async function listUsers({ role, status, search } = {}) {
  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { username: { [Op.like]: `%${search}%` } },
      { full_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }
  return User.findAll({
    where,
    attributes: { exclude: ['password_hash'] },
    include: [{ model: Lawyer, as: 'lawyerProfile', attributes: ['id', 'specialization', 'availability_status', 'status'], required: false }],
    order: [['created_at', 'DESC']],
  });
}

export async function updateUserStatus(adminId, userId, status) {
  if (!['ACTIVE', 'INACTIVE'].includes(status)) throw new ApiError(400, 'Trạng thái tài khoản không hợp lệ.');
  if (Number(adminId) === Number(userId) && status === 'INACTIVE') {
    throw new ApiError(409, 'Quản trị viên không thể khóa tài khoản đang đăng nhập.');
  }
  const user = await User.findByPk(userId, { attributes: { exclude: ['password_hash'] } });
  if (!user) throw new ApiError(404, 'Không tìm thấy tài khoản.');
  await user.update({ status });
  return user;
}

export async function listCategories() {
  return LegalCategory.findAll({ order: [['name', 'ASC']] });
}

export async function createCategory(payload) {
  if (!payload.name?.trim() || !payload.slug?.trim()) throw new ApiError(400, 'Tên và slug danh mục là bắt buộc.');
  return LegalCategory.create({
    name: payload.name.trim(), slug: payload.slug.trim(),
    description: payload.description?.trim() || null,
    status: payload.status || 'ACTIVE',
  });
}

export async function updateCategory(id, payload) {
  const category = await LegalCategory.findByPk(id);
  if (!category) throw new ApiError(404, 'Không tìm thấy danh mục pháp luật.');
  const changes = {};
  for (const field of ['name', 'slug', 'description', 'status']) {
    if (payload[field] !== undefined) changes[field] = payload[field];
  }
  await category.update(changes);
  return category;
}

export async function deleteCategory(id) {
  const category = await LegalCategory.findByPk(id);
  if (!category) throw new ApiError(404, 'Không tìm thấy danh mục pháp luật.');
  try {
    await category.destroy();
  } catch {
    throw new ApiError(409, 'Danh mục đang được sử dụng và không thể xóa. Hãy chuyển sang INACTIVE.');
  }
}
