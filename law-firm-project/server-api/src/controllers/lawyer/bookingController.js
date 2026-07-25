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
  const result = await bookingService.updateLawyerBookingStatus(
    req.user.id,
    req.params.id,
    status,
    reason ?? null
  );
  res.json({
    success: true,
    data: result.booking.toJSON(),
    email_sent: result.email_sent,
    message: result.email_sent
      ? 'Đã cập nhật lịch hẹn và gửi email cho khách hàng.'
      : 'Đã cập nhật lịch hẹn nhưng chưa gửi được email cho khách hàng.',
  });
}


export async function remove(req, res) {
  const result = await bookingService.deleteLawyerBooking(
    req.user.id,
    req.params.id
  );
  res.json({
    success: true,
    email_sent: result.email_sent,
    message: result.email_sent
      ? 'Đã xóa lịch hẹn và gửi email cho khách hàng.'
      : 'Đã xóa lịch hẹn nhưng chưa gửi được email cho khách hàng.',
  });
}
