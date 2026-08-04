import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';

const { sequelize } = await import('../src/config/database.js');
const { Booking, Lawyer, LawyerSchedule, User } = await import('../src/models/index.js');
const { createPublicBooking } = await import('../src/services/bookingService.js');

let lawyer;

function futureAt(hour, minute = 0) {
  const value = new Date();
  value.setDate(value.getDate() + 7);
  value.setHours(hour, minute, 0, 0);
  return value;
}

function toLocalInput(value) {
  const pad = (part) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
    + `T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function bookingPayload(appointmentDate, durationMinutes = 60) {
  return {
    lawyer_id: lawyer.id,
    customer_name: 'Test Customer',
    customer_phone: '0900000000',
    customer_email: 'booking-test@example.com',
    appointment_date: appointmentDate,
    duration_minutes: durationMinutes,
    summary_issue: 'Schedule validation test',
  };
}

before(async () => {
  await sequelize.sync({ force: true });
  const user = await User.create({
    username: 'schedule.test.lawyer',
    email: 'schedule-lawyer@example.com',
    password_hash: 'not-used-in-this-test',
    full_name: 'Test Lawyer',
    role: 'LAWYER',
    status: 'ACTIVE',
  });
  lawyer = await Lawyer.create({
    user_id: user.id,
    full_name: user.full_name,
    email: user.email,
    specialization: 'Civil',
    status: 'active',
  });
});

beforeEach(async () => {
  await Booking.destroy({ where: {} });
  await LawyerSchedule.destroy({ where: {} });
  const appointment = futureAt(10);
  await LawyerSchedule.create({
    lawyer_id: lawyer.id,
    day_of_week: appointment.getDay(),
    start_time: '09:00',
    end_time: '12:00',
    is_available: true,
  });
});

after(async () => {
  await sequelize.close();
});

test('saves only an in-shift booking and persists its PENDING status', async () => {
  const booking = await createPublicBooking(bookingPayload(toLocalInput(futureAt(10)), 60));

  assert.equal(booking.status, 'PENDING');
  assert.equal(await Booking.count(), 1);
  assert.equal((await Booking.findByPk(booking.id)).status, 'PENDING');
});

test('does not save a booking that starts outside the working shift', async () => {
  await assert.rejects(
    createPublicBooking(bookingPayload(futureAt(8, 30), 60)),
    (error) => error.statusCode === 409 && /ca làm việc/.test(error.message),
  );
  assert.equal(await Booking.count(), 0);
});

test('does not save a booking that ends after the working shift', async () => {
  await assert.rejects(
    createPublicBooking(bookingPayload(futureAt(11, 30), 60)),
    (error) => error.statusCode === 409 && /ca làm việc/.test(error.message),
  );
  assert.equal(await Booking.count(), 0);
});

test('does not save when the lawyer has no available shift that day', async () => {
  await LawyerSchedule.destroy({ where: {} });
  await assert.rejects(
    createPublicBooking(bookingPayload(futureAt(10), 60)),
    (error) => error.statusCode === 409 && /ca làm việc/.test(error.message),
  );
  assert.equal(await Booking.count(), 0);
});
