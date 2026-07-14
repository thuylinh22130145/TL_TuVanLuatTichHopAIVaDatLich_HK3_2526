import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import { fetchAdminOverview } from '../../services/adminPortalService';
import { formatAppointmentDate } from '../../utils/bookingStatus';

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminOverview().then(setData).catch((requestError) => setError(requestError.response?.data?.message || requestError.message));
  }, []);

  const stats = data?.statistics || {};

  return (
    <div>
      <p className='text-sm font-medium text-law-gold'>Điều hành hệ thống</p>
      <h1 className='mt-1 font-serif text-3xl font-bold text-law-navy'>Tổng quan quản trị</h1>
      <p className='mt-2 text-sm text-slate-500'>Theo dõi tài khoản, luật sư, lịch tư vấn và kho dữ liệu pháp luật.</p>

      {error && <p className='mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700'>{error}</p>}

      <section className='my-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {[
          ['Tổng tài khoản', stats.users || 0, `${stats.customers || 0} khách hàng`],
          ['Luật sư hoạt động', stats.activeLawyers || 0, `${stats.pendingApplications || 0} hồ sơ chờ duyệt`],
          ['Tổng lịch tư vấn', stats.bookings || 0, `${stats.pendingBookings || 0} lịch chờ xác nhận`],
          ['Danh mục pháp luật', stats.categories || 0, `${stats.documents || 0} tài liệu đã lưu`],
        ].map(([label, value, detail]) => (
          <article key={label} className='rounded-2xl border border-slate-100 bg-white p-5 shadow-sm'>
            <p className='text-sm text-slate-500'>{label}</p>
            <p className='mt-2 text-3xl font-bold text-law-navy'>{value}</p>
            <p className='mt-2 text-xs text-law-gold'>{detail}</p>
          </article>
        ))}
      </section>

      <section className='grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]'>
        <div className='rounded-2xl bg-white p-6 shadow-sm'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-bold text-law-navy'>Lịch tư vấn mới nhất</h2>
            <Link to='/admin/appointments' className='text-sm font-semibold text-law-gold'>Quản lý lịch</Link>
          </div>
          <div className='mt-4 divide-y divide-slate-100'>
            {(data?.recentBookings || []).map((booking) => (
              <article key={booking.id} className='grid gap-3 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center'>
                <div>
                  <p className='font-semibold text-law-navy'>{booking.customer_name}</p>
                  <p className='text-xs text-slate-500'>{booking.booking_code}</p>
                </div>
                <div className='text-sm text-slate-600'>
                  <p>{booking.lawyer?.full_name || 'Chưa phân công'}</p>
                  <p className='text-xs'>{formatAppointmentDate(booking.appointment_date)}</p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </article>
            ))}
            {!data?.recentBookings?.length && <p className='py-8 text-center text-sm text-slate-500'>Chưa có lịch tư vấn.</p>}
          </div>
        </div>

        <div className='rounded-2xl bg-law-navy p-6 text-white shadow-sm'>
          <h2 className='text-lg font-bold'>Quản lý nhanh</h2>
          <div className='mt-5 grid gap-3'>
            <Link to='/admin/users' className='rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15'>Tài khoản người dùng</Link>
            <Link to='/admin/lawyer-applications' className='rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15'>Duyệt hồ sơ luật sư</Link>
            <Link to='/admin/categories' className='rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15'>Danh mục pháp luật</Link>
            <Link to='/admin/documents' className='rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15'>Kho tài liệu RAG</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
