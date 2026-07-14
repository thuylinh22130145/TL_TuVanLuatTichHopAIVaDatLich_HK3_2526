import * as bookingService from '../../services/bookingService.js';
import { ApiError } from '../../utils/ApiError.js';

export async function list(req, res) {
  const bookings = await bookingService.listCustomerBookings(req.user.id);
  res.json({ success: true, data: bookings.map((booking) => booking.toJSON()) });
}

export async function getOne(req, res) {
  const booking = await bookingService.getCustomerBooking(req.user.id, req.params.id);
  res.json({ success: true, data: booking.toJSON() });
}

export async function create(req, res) {
  const { lawyer_id, appointment_date, duration_minutes, summary_issue, customer_phone } = req.body;
  if (!lawyer_id || !appointment_date || !summary_issue) {
    throw new ApiError(400, 'Vui lòng chọn luật sư, thời gian hẹn và nhập nội dung cần tư vấn.');
  }
  if (!customer_phone && !req.user.phone) {
    throw new ApiError(400, 'Vui lòng cung cấp số điện thoại liên hệ.');
  }

  const booking = await bookingService.createCustomerBooking(req.user, {
    lawyer_id,
    appointment_date,
    duration_minutes,
    summary_issue,
    customer_phone,
  });
  res.status(201).json({ success: true, data: booking.toJSON(), message: 'Đặt lịch thành công.' });
}

export async function update(req, res) {
  const booking = await bookingService.updateCustomerBooking(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: booking.toJSON(), message: 'Đã cập nhật lịch hẹn.' });
}

export async function cancel(req, res) {
  const booking = await bookingService.cancelCustomerBooking(
    req.user.id,
    req.params.id,
    req.body.reason ?? null
  );
  res.json({ success: true, data: booking.toJSON(), message: 'Đã hủy lịch hẹn.' });
}
