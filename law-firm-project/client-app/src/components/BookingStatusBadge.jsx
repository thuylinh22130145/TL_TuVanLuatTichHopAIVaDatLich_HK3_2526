import { getBookingStatus } from '../utils/bookingStatus';

export default function BookingStatusBadge({ status }) {
  const detail = getBookingStatus(status);
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${detail.className}`}>
      {detail.label}
    </span>
  );
}
