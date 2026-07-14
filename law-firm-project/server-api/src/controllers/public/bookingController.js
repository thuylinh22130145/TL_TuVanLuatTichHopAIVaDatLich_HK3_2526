import * as bookingService from '../../services/bookingService.js';
import { ApiError } from '../../utils/ApiError.js';

export async function createBooking(req, res) {
  const { lawyer_id, customer_name, customer_phone, customer_email, appointment_date, duration_minutes, summary_issue } = req.body;
  if (!lawyer_id || !customer_name || !customer_phone || !customer_email || !appointment_date || !summary_issue) {
    throw new ApiError(400, 'Vui lòng chọn luật sư và nhập đầy đủ thông tin bắt buộc.');
  }
  const booking = await bookingService.createPublicBooking({
    lawyer_id, customer_name, customer_phone, customer_email,
    appointment_date, duration_minutes, summary_issue,
  });
  res.status(201).json({
    success: true,
    data: {
      booking_code: booking.booking_code,
      id: booking.id,
      status: booking.status,
      appointment_date: booking.appointment_date,
    },
    message: 'Đặt lịch thành công.',
  });
}
