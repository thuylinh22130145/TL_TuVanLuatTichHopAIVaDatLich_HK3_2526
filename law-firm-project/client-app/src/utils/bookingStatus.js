export const BOOKING_STATUS = {
  PENDING: { label: 'Chờ xác nhận', className: 'bg-amber-100 text-amber-800' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-800' },
  REJECTED: { label: 'Đã từ chối', className: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-gray-200 text-gray-700' },
  COMPLETED: { label: 'Hoàn thành', className: 'bg-emerald-100 text-emerald-800' },
};

export function getBookingStatus(status) {
  return BOOKING_STATUS[status] || { label: status || 'Không xác định', className: 'bg-gray-100 text-gray-700' };
}

export function formatAppointmentDate(value) {
  if (!value) return 'Chưa xác định';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
