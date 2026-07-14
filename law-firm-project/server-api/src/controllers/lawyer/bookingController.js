import * as bookingService from '../../services/bookingService.js';
import { ApiError } from '../../utils/ApiError.js';

export async function list(req, res) {
  const bookings = await bookingService.listLawyerBookings(req.user.id, req.query.status ?? null);
  res.json({ success: true, data: bookings.map((booking) => booking.toJSON()) });
}

export async function getOne(req, res) {
  const booking = await bookingService.getLawyerBooking(req.user.id, req.params.id);
  res.json({ success: true, data: booking.toJSON() });
}

export async function updateStatus(req, res) {
  const { status, reason } = req.body;
  if (!status) throw new ApiError(400, 'Vui lòng cung cấp trạng thái mới.');
  const booking = await bookingService.updateLawyerBookingStatus(
    req.user.id,
    req.params.id,
    status,
    reason ?? null
  );
  res.json({ success: true, data: booking.toJSON(), message: 'Đã cập nhật trạng thái lịch hẹn.' });
}
