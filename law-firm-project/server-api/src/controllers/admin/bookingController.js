import * as bookingService from '../../services/bookingService.js';
import { ApiError } from '../../utils/ApiError.js';

export async function list(req, res) {
  const bookings = await bookingService.listAllBookings();
  res.json({ success: true, data: bookings.map((booking) => booking.toJSON()) });
}

export async function getOne(req, res) {
  const booking = await bookingService.getBookingById(req.params.id);
  res.json({ success: true, data: booking.toJSON() });
}

export async function create(req, res) {
  const required = ['lawyer_id', 'customer_name', 'customer_phone', 'customer_email', 'appointment_date', 'summary_issue'];
  for (const field of required) {
    if (!req.body[field]) throw new ApiError(400, `Thiếu trường: ${field}`);
  }
  const booking = await bookingService.createBookingAdmin({
    user_id: req.body.user_id ?? null,
    lawyer_id: req.body.lawyer_id,
    customer_name: req.body.customer_name,
    customer_phone: req.body.customer_phone,
    customer_email: req.body.customer_email,
    appointment_date: req.body.appointment_date,
    duration_minutes: req.body.duration_minutes ?? 60,
    summary_issue: req.body.summary_issue,
    status: req.body.status ?? 'PENDING',
    cancellation_reason: req.body.cancellation_reason ?? null,
  });
  res.status(201).json({ success: true, data: booking.toJSON() });
}

export async function update(req, res) {
  const booking = await bookingService.updateBooking(req.params.id, req.body);
  res.json({ success: true, data: booking.toJSON() });
}

export async function remove(req, res) {
  await bookingService.deleteBooking(req.params.id);
  res.json({ success: true, message: 'Đã xóa lịch hẹn.' });
}
