import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import { fetchLawyerAppointments } from '../../services/appointmentService';
import { fetchLawyerProfile } from '../../services/lawyerPortalService';
import { formatAppointmentDate } from '../../utils/bookingStatus';

export default function LawyerOverview() {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchLawyerProfile(), fetchLawyerAppointments()])
      .then(([profileData, bookingData]) => {
        setProfile(profileData);
        setAppointments(bookingData.filter((item) => ['PENDING', 'CONFIRMED'].includes(item.statusCode)).slice(0, 5));
      })
      .catch((requestError) => setError(requestError.response?.data?.message || requestError.message));
  }, []);

  const statistics = profile?.statistics || {};
  const lawyer = profile?.lawyer;

  return (
    <div className='px-6 py-8 lg:px-10'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <p className='text-sm font-medium text-law-gold'>Tổng quan hoạt động</p>
          <h1 className='mt-1 font-serif text-3xl font-bold text-law-navy'>Xin chào, {lawyer?.full_name || 'Luật sư'}</h1>
          <p className='mt-2 text-sm text-slate-500'>{lawyer?.specialization || 'Chuyên môn đang cập nhật'}</p>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-semibold ${lawyer?.availability_status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {lawyer?.availability_status === 'AVAILABLE' ? 'Sẵn sàng tư vấn' : 'Đang bận'}
        </span>
      </div>

      {error && <p className='mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700'>{error}</p>}

      <section className='my-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {[
          ['Tổng lịch tư vấn', statistics.total || 0, 'text-law-navy'],
          ['Chờ xác nhận', statistics.pending || 0, 'text-amber-600'],
          ['Sắp tư vấn', statistics.confirmed || 0, 'text-blue-600'],
          ['Đã hoàn thành', statistics.completed || 0, 'text-emerald-600'],
        ].map(([label, value, color]) => (
          <article key={label} className='rounded-2xl border border-slate-100 bg-white p-5 shadow-sm'>
            <p className='text-sm text-slate-500'>{label}</p>
            <p className={`mt-3 text-3xl font-bold ${color}`}>{value}</p>
          </article>
        ))}
      </section>

      <section className='grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]'>
        <div className='rounded-2xl bg-white p-6 shadow-sm'>
          <div className='flex items-center justify-between gap-3'>
            <h2 className='text-lg font-bold text-law-navy'>Lịch cần xử lý</h2>
            <Link to='/lawyer/appointments' className='text-sm font-semibold text-law-gold'>Xem tất cả</Link>
          </div>
          <div className='mt-4 divide-y divide-slate-100'>
            {appointments.length ? appointments.map((appointment) => (
              <article key={appointment.id} className='flex flex-wrap items-center justify-between gap-3 py-4'>
                <div>
                  <p className='font-semibold text-law-navy'>{appointment.customerName}</p>
                  <p className='mt-1 text-sm text-slate-500'>{formatAppointmentDate(appointment.scheduledAt)}</p>
                </div>
                <BookingStatusBadge status={appointment.statusCode} />
              </article>
            )) : <p className='py-8 text-center text-sm text-slate-500'>Không có lịch cần xử lý.</p>}
          </div>
        </div>

        <div className='rounded-2xl bg-law-navy p-6 text-white shadow-sm'>
          <h2 className='text-lg font-bold'>Thao tác nhanh</h2>
          <div className='mt-5 grid gap-3'>
            <Link to='/lawyer/appointments' className='rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15'>Quản lý lịch tư vấn</Link>
            <Link to='/lawyer/schedule' className='rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15'>Cập nhật lịch làm việc</Link>
            <Link to='/lawyer/legal-search' className='rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15'>Tra cứu pháp luật</Link>
            <Link to='/lawyer/profile' className='rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15'>Cập nhật hồ sơ</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
