/** Trạng thái lịch hẹn đồng bộ với BOOKING_STATUSES ở server-api. */
export const APPOINTMENT_STATUSES = [
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'CONFIRMED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'CANCELLED', label: 'Hủy' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
];
