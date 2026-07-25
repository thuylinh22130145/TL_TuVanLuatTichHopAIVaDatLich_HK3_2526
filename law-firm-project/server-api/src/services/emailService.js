import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

let transporter;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getTransporter() {
  if (!env.mail.password) {
    throw new ApiError(
      503,
      'Máy chủ chưa được cấu hình mật khẩu ứng dụng để gửi email OTP.'
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth: {
        user: env.mail.user,
        pass: env.mail.password,
      },
    });
  }

  return transporter;
}

export async function sendRegistrationOtp({ email, fullName, otp, expiresMinutes }) {
  try {
    await getTransporter().sendMail({
      from: {
        name: env.mail.fromName,
        address: env.mail.user,
      },
      to: email,
      subject: 'Mã OTP xác thực đăng ký tài khoản',
      text:
        'Xin chào ' + fullName + ', mã OTP xác thực đăng ký của bạn là ' + otp +
        '. Mã có hiệu lực trong ' + expiresMinutes +
        ' phút. Không chia sẻ mã này với bất kỳ ai.',
      html:
        '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#14213d">' +
        '<h2>Xác thực đăng ký tài khoản</h2>' +
        '<p>Xin chào ' + escapeHtml(fullName) + ',</p>' +
        '<p>Dùng mã dưới đây để hoàn tất đăng ký:</p>' +
        '<div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 20px;background:#f4f6f8;border-radius:10px;text-align:center">' +
        otp +
        '</div><p>Mã có hiệu lực trong <strong>' + expiresMinutes +
        ' phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p></div>',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('[Mail] Không thể gửi OTP:', error.code || error.message);
    if (error.code === 'EAUTH') {
      throw new ApiError(
        502,
        'Email gửi OTP bị từ chối đăng nhập. Vui lòng kiểm tra địa chỉ gửi và App Password.'
      );
    }
    throw new ApiError(502, 'Không thể gửi email OTP. Vui lòng thử lại sau.');
  }
}

export async function sendLawyerApplicationDecision({
  email,
  fullName,
  status,
  reviewNote,
}) {
  const approved = status === 'approved';
  const statusLabel = approved ? 'ĐÃ ĐƯỢC DUYỆT' : 'ĐÃ BỊ TỪ CHỐI';
  const subject = approved
    ? 'Hồ sơ đăng ký luật sư đã được duyệt'
    : 'Hồ sơ đăng ký luật sư đã bị từ chối';
  const safeName = escapeHtml(fullName);
  const safeNote = reviewNote ? escapeHtml(reviewNote) : '';
  const resultText = approved
    ? 'Tài khoản của bạn đã được kích hoạt vai trò luật sư. Bạn có thể đăng nhập để sử dụng cổng luật sư.'
    : 'Hồ sơ của bạn chưa đáp ứng yêu cầu xét duyệt của quản trị viên.';
  const noteText = reviewNote
    ? ' Ghi chú của quản trị viên: ' + reviewNote
    : '';

  try {
    await getTransporter().sendMail({
      from: {
        name: env.mail.fromName,
        address: env.mail.user,
      },
      to: email,
      subject,
      text:
        'Xin chào ' + fullName + '. Hồ sơ đăng ký luật sư của bạn ' +
        statusLabel.toLowerCase() + '. ' + resultText + noteText,
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#14213d">' +
        '<h2>Kết quả xét duyệt hồ sơ luật sư</h2>' +
        '<p>Xin chào ' + safeName + ',</p>' +
        '<div style="padding:14px 18px;border-radius:10px;font-weight:700;text-align:center;' +
        (approved
          ? 'background:#ecfdf3;color:#067647'
          : 'background:#fff1f1;color:#b42318') +
        '">' + statusLabel + '</div>' +
        '<p style="line-height:1.7">' + resultText + '</p>' +
        (safeNote
          ? '<div style="margin-top:16px;padding:14px 16px;background:#f4f6f8;border-radius:10px">' +
            '<strong>Ghi chú của quản trị viên:</strong><br>' + safeNote +
            '</div>'
          : '') +
        '<p style="margin-top:20px;color:#667085">Trân trọng,<br>' +
        escapeHtml(env.mail.fromName) + '</p></div>',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('[Mail] Không thể gửi kết quả hồ sơ luật sư:', error.code || error.message);
    throw new ApiError(502, 'Không thể gửi email thông báo kết quả hồ sơ luật sư.');
  }
}


function formatAppointmentDate(value) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(value));
}

export async function sendBookingStatusNotification({
  email,
  customerName,
  lawyerName,
  bookingCode,
  appointmentDate,
  status,
  reason,
}) {
  const configurations = {
    CONFIRMED: {
      subject: 'Lịch hẹn tư vấn đã được luật sư xác nhận',
      title: 'LỊCH HẸN ĐÃ ĐƯỢC XÁC NHẬN',
      detail: 'Luật sư đã xác nhận lịch tư vấn của bạn.',
      color: '#067647',
      background: '#ecfdf3',
    },
    REJECTED: {
      subject: 'Lịch hẹn tư vấn đã bị luật sư từ chối',
      title: 'LỊCH HẸN ĐÃ BỊ TỪ CHỐI',
      detail: 'Luật sư không thể tiếp nhận lịch tư vấn này.',
      color: '#b42318',
      background: '#fff1f1',
    },
    CANCELLED: {
      subject: 'Luật sư đã hủy lịch hẹn tư vấn',
      title: 'LỊCH HẸN ĐÃ BỊ HỦY',
      detail: 'Luật sư đã hủy lịch tư vấn đã xác nhận.',
      color: '#b42318',
      background: '#fff1f1',
    },
    COMPLETED: {
      subject: 'Lịch tư vấn đã hoàn thành',
      title: 'LỊCH TƯ VẤN ĐÃ HOÀN THÀNH',
      detail: 'Luật sư đã đánh dấu buổi tư vấn là hoàn thành.',
      color: '#175cd3',
      background: '#eff8ff',
    },
    DELETED: {
      subject: 'Lịch hẹn tư vấn đã được xóa',
      title: 'LỊCH HẸN ĐÃ ĐƯỢC XÓA',
      detail: 'Luật sư đã xóa lịch hẹn khỏi hệ thống sau khi kết thúc xử lý.',
      color: '#475467',
      background: '#f2f4f7',
    },
  };

  const configuration = configurations[status];
  if (!configuration) {
    throw new ApiError(400, 'Trạng thái email lịch hẹn không hợp lệ.');
  }

  const safeCustomerName = escapeHtml(customerName);
  const safeLawyerName = escapeHtml(lawyerName || 'Luật sư phụ trách');
  const safeBookingCode = escapeHtml(bookingCode);
  const safeReason = reason ? escapeHtml(reason) : '';
  const appointmentLabel = formatAppointmentDate(appointmentDate);
  const reasonText = reason ? ' Lý do: ' + reason : '';

  try {
    await getTransporter().sendMail({
      from: {
        name: env.mail.fromName,
        address: env.mail.user,
      },
      to: email,
      subject: configuration.subject,
      text:
        'Xin chào ' + customerName + '. ' + configuration.detail +
        ' Mã lịch: ' + bookingCode + '. Luật sư: ' + lawyerName +
        '. Thời gian: ' + appointmentLabel + '.' + reasonText,
      html:
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#14213d">' +
        '<h2>Thông báo lịch hẹn tư vấn</h2>' +
        '<p>Xin chào ' + safeCustomerName + ',</p>' +
        '<div style="padding:14px 18px;border-radius:10px;font-weight:700;text-align:center;' +
        'background:' + configuration.background + ';color:' + configuration.color + '">' +
        configuration.title + '</div>' +
        '<p style="line-height:1.7">' + configuration.detail + '</p>' +
        '<table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px">' +
        '<tr><td style="padding:8px 12px;font-weight:700">Mã lịch</td><td style="padding:8px 12px">' + safeBookingCode + '</td></tr>' +
        '<tr><td style="padding:8px 12px;font-weight:700">Luật sư</td><td style="padding:8px 12px">' + safeLawyerName + '</td></tr>' +
        '<tr><td style="padding:8px 12px;font-weight:700">Thời gian</td><td style="padding:8px 12px">' + appointmentLabel + '</td></tr>' +
        '</table>' +
        (safeReason
          ? '<div style="margin-top:16px;padding:14px 16px;background:#fff7ed;border-radius:10px">' +
            '<strong>Lý do:</strong><br>' + safeReason + '</div>'
          : '') +
        '<p style="margin-top:20px;color:#667085">Trân trọng,<br>' +
        escapeHtml(env.mail.fromName) + '</p></div>',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('[Mail] Không thể gửi thông báo lịch hẹn:', error.code || error.message);
    throw new ApiError(502, 'Không thể gửi email thông báo lịch hẹn.');
  }
}
