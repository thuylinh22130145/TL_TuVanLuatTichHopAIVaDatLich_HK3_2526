import { Booking } from '../models/index.js';

const CODE_PREFIX = 'LAW';
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SUFFIX_LENGTH = 4;
const MAX_ATTEMPTS = 25;

function randomSuffix() {
  let s = '';
  for (let i = 0; i < SUFFIX_LENGTH; i += 1) {
    s += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return s;
}

/**
 * Sinh mã đặt lịch dạng LAW-XXXX, đảm bảo không trùng trong bảng bookings.
 * @returns {Promise<string>}
 */
export async function generateUniqueBookingCode() {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = `${CODE_PREFIX}-${randomSuffix()}`;
    const existing = await Booking.findOne({
      where: { booking_code: code },
      attributes: ['id'],
    });
    if (!existing) return code;
  }
  throw new Error('Không thể sinh mã đặt lịch duy nhất sau nhiều lần thử');
}
