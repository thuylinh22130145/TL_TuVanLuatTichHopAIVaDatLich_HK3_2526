import { Op } from 'sequelize';
import { Booking, Lawyer, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { generateUniqueBookingCode } from '../utils/bookingCode.js';
import { BOOKING_STATUSES } from '../models/Booking.js';
import { sendBookingStatusNotification } from './emailService.js';

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED'];
const CUSTOMER_EDITABLE_STATUSES = ['PENDING'];
const CUSTOMER_CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];
const LAWYER_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'REJECTED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
};

const bookingInclude = [
  { model: Lawyer, as: 'lawyer', attributes: ['id', 'user_id', 'full_name', 'specialization'] },
  { model: User, as: 'customer', attributes: ['id', 'username', 'full_name', 'email', 'phone'] },
];

function parseAppointment(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    throw new ApiError(400, 'Thời gian hẹn không hợp lệ.');
  }
  if (date <= new Date()) {
    throw new ApiError(400, 'Thời gian hẹn phải ở trong tương lai.');
  }
  return date;
}

function normalizeDuration(value) {
  const duration = Number(value ?? 60);
  if (!Number.isInteger(duration) || duration < 15 || duration > 480) {
    throw new ApiError(400, 'Thời lượng cuộc hẹn phải từ 15 đến 480 phút.');
  }
  return duration;
}

async function ensureLawyerExists(lawyerId) {
  if (!lawyerId) throw new ApiError(400, 'Vui lòng chọn luật sư.');
  const lawyer = await Lawyer.findOne({ where: { id: lawyerId, status: 'active' } });
  if (!lawyer) throw new ApiError(404, 'Không tìm thấy luật sư đang hoạt động.');
  return lawyer;
}

async function ensureNoConflict({ lawyerId, appointmentDate, durationMinutes, excludeBookingId = null }) {
  const start = parseAppointment(appointmentDate);
  const end = new Date(start.getTime() + normalizeDuration(durationMinutes) * 60_000);
  const where = { lawyer_id: lawyerId, status: { [Op.in]: ACTIVE_STATUSES } };
  if (excludeBookingId) where.id = { [Op.ne]: excludeBookingId };

  const bookings = await Booking.findAll({ where, attributes: ['id', 'appointment_date', 'duration_minutes'] });
  const conflict = bookings.some((booking) => {
    const existingStart = new Date(booking.appointment_date);
    const existingEnd = new Date(existingStart.getTime() + booking.duration_minutes * 60_000);
    return start < existingEnd && end > existingStart;
  });

  if (conflict) throw new ApiError(409, 'Luật sư đã có lịch hẹn trong khoảng thời gian này.');
}

async function createBooking(payload) {
  await ensureLawyerExists(payload.lawyer_id);
  const appointmentDate = parseAppointment(payload.appointment_date);
  const durationMinutes = normalizeDuration(payload.duration_minutes);
  await ensureNoConflict({
    lawyerId: payload.lawyer_id,
    appointmentDate,
    durationMinutes,
  });

  return Booking.create({
    ...payload,
    appointment_date: appointmentDate,
    duration_minutes: durationMinutes,
    booking_code: payload.booking_code || await generateUniqueBookingCode(),
    status: payload.status || 'PENDING',
  });
}

export async function listAllBookings() {
  return Booking.findAll({ include: bookingInclude, order: [['appointment_date', 'DESC']] });
}

export async function getBookingById(id) {
  const booking = await Booking.findByPk(id, { include: bookingInclude });
  if (!booking) throw new ApiError(404, 'Không tìm thấy lịch hẹn.');
  return booking;
}

export async function createPublicBooking(payload) {
  return createBooking({ ...payload, user_id: null, status: 'PENDING' });
}

export async function createBookingAdmin(payload) {
  if (payload.status && !BOOKING_STATUSES.includes(payload.status)) {
    throw new ApiError(400, 'Trạng thái lịch hẹn không hợp lệ.');
  }
  return createBooking(payload);
}

export async function updateBooking(id, payload) {
  if (payload.status && !BOOKING_STATUSES.includes(payload.status)) {
    throw new ApiError(400, 'Trạng thái lịch hẹn không hợp lệ.');
  }
  const booking = await getBookingById(id);
  const schedulingChanged = payload.lawyer_id !== undefined
    || payload.appointment_date !== undefined
    || payload.duration_minutes !== undefined;
  if (schedulingChanged) {
    const lawyerId = payload.lawyer_id ?? booking.lawyer_id;
    const appointmentDate = payload.appointment_date ?? booking.appointment_date;
    const durationMinutes = payload.duration_minutes ?? booking.duration_minutes;
    await ensureLawyerExists(lawyerId);
    await ensureNoConflict({ lawyerId, appointmentDate, durationMinutes, excludeBookingId: booking.id });
  }
  await booking.update(payload);
  return getBookingById(id);
}

export async function deleteBooking(id) {
  const booking = await getBookingById(id);
  await booking.destroy();
  return true;
}

export async function listCustomerBookings(userId) {
  return Booking.findAll({
    where: { user_id: userId },
    include: [{ model: Lawyer, as: 'lawyer', attributes: ['id', 'full_name', 'specialization', 'phone', 'email'] }],
    order: [['appointment_date', 'DESC']],
  });
}

export async function getCustomerBooking(userId, bookingId) {
  const booking = await Booking.findOne({
    where: { id: bookingId, user_id: userId },
    include: [{ model: Lawyer, as: 'lawyer', attributes: ['id', 'full_name', 'specialization', 'phone', 'email'] }],
  });
  if (!booking) throw new ApiError(404, 'Không tìm thấy lịch hẹn của bạn.');
  return booking;
}

export async function createCustomerBooking(user, payload) {
  return createBooking({
    user_id: user.id,
    lawyer_id: payload.lawyer_id,
    customer_name: user.full_name,
    customer_phone: payload.customer_phone || user.phone,
    customer_email: user.email,
    appointment_date: payload.appointment_date,
    duration_minutes: payload.duration_minutes,
    summary_issue: payload.summary_issue,
    status: 'PENDING',
  });
}

export async function updateCustomerBooking(userId, bookingId, payload) {
  const booking = await getCustomerBooking(userId, bookingId);
  if (!CUSTOMER_EDITABLE_STATUSES.includes(booking.status)) {
    throw new ApiError(409, 'Chỉ có thể chỉnh sửa lịch đang chờ xác nhận.');
  }

  const allowed = {
    lawyer_id: payload.lawyer_id ?? booking.lawyer_id,
    appointment_date: payload.appointment_date ?? booking.appointment_date,
    duration_minutes: payload.duration_minutes ?? booking.duration_minutes,
    summary_issue: payload.summary_issue ?? booking.summary_issue,
    customer_phone: payload.customer_phone ?? booking.customer_phone,
  };
  await ensureLawyerExists(allowed.lawyer_id);
  await ensureNoConflict({
    lawyerId: allowed.lawyer_id,
    appointmentDate: allowed.appointment_date,
    durationMinutes: allowed.duration_minutes,
    excludeBookingId: booking.id,
  });
  await booking.update(allowed);
  return getCustomerBooking(userId, bookingId);
}

export async function cancelCustomerBooking(userId, bookingId, reason = null) {
  const booking = await getCustomerBooking(userId, bookingId);
  if (!CUSTOMER_CANCELLABLE_STATUSES.includes(booking.status)) {
    throw new ApiError(409, 'Lịch hẹn này không thể hủy.');
  }
  await booking.update({ status: 'CANCELLED', cancellation_reason: reason });
  return getCustomerBooking(userId, bookingId);
}

async function getLawyerProfile(userId) {
  const lawyer = await Lawyer.findOne({ where: { user_id: userId, status: 'active' } });
  if (!lawyer) throw new ApiError(404, 'Không tìm thấy hồ sơ luật sư đang hoạt động.');
  return lawyer;
}

export async function listLawyerBookings(userId, status = null) {
  const lawyer = await getLawyerProfile(userId);
  if (status && !BOOKING_STATUSES.includes(status)) throw new ApiError(400, 'Trạng thái không hợp lệ.');
  return Booking.findAll({
    where: { lawyer_id: lawyer.id, ...(status ? { status } : {}) },
    include: [{ model: User, as: 'customer', attributes: ['id', 'full_name', 'email', 'phone'] }],
    order: [['appointment_date', 'ASC']],
  });
}

export async function getLawyerBooking(userId, bookingId) {
  const lawyer = await getLawyerProfile(userId);
  const booking = await Booking.findOne({
    where: { id: bookingId, lawyer_id: lawyer.id },
    include: [
      { model: User, as: 'customer', attributes: ['id', 'full_name', 'email', 'phone'] },
      { model: Lawyer, as: 'lawyer', attributes: ['id', 'full_name', 'email', 'phone'] },
    ],
  });
  if (!booking) throw new ApiError(404, 'Không tìm thấy lịch hẹn của luật sư.');
  return booking;
}

async function sendLawyerBookingNotification(booking, status) {
  try {
    await sendBookingStatusNotification({
      email: booking.customer_email,
      customerName: booking.customer_name,
      lawyerName: booking.lawyer?.full_name,
      bookingCode: booking.booking_code,
      appointmentDate: booking.appointment_date,
      status,
      reason: booking.cancellation_reason,
    });
    return true;
  } catch (error) {
    console.error(
      '[Booking] Đã cập nhật lịch nhưng không gửi được email:',
      error.message
    );
    return false;
  }
}

export async function updateLawyerBookingStatus(userId, bookingId, nextStatus, reason = null) {
  if (!BOOKING_STATUSES.includes(nextStatus)) {
    throw new ApiError(400, 'Trạng thái không hợp lệ.');
  }
  const booking = await getLawyerBooking(userId, bookingId);
  const allowed = LAWYER_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(
      409,
      `Không thể chuyển trạng thái từ ${booking.status} sang ${nextStatus}.`
    );
  }
  if (['REJECTED', 'CANCELLED'].includes(nextStatus) && !reason?.trim()) {
    throw new ApiError(400, 'Vui lòng nhập lý do từ chối hoặc hủy lịch.');
  }

  await booking.update({
    status: nextStatus,
    cancellation_reason: reason?.trim() || null,
  });
  const updatedBooking = await getLawyerBooking(userId, bookingId);
  const email_sent = await sendLawyerBookingNotification(updatedBooking, nextStatus);
  return { booking: updatedBooking, email_sent };
}

export async function deleteLawyerBooking(userId, bookingId) {
  const booking = await getLawyerBooking(userId, bookingId);
  if (!['REJECTED', 'CANCELLED', 'COMPLETED'].includes(booking.status)) {
    throw new ApiError(
      409,
      'Chỉ được xóa lịch đã từ chối, đã hủy hoặc đã hoàn thành.'
    );
  }

  const snapshot = booking.toJSON();
  await booking.destroy();
  const email_sent = await sendLawyerBookingNotification(booking, 'DELETED');
  return { booking: snapshot, email_sent };
}
