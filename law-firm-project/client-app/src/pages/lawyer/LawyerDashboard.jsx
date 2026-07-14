import { useCallback, useEffect, useMemo, useState } from 'react';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import { useAuth } from '../../context/AuthContext';
import {
  fetchLawyerAppointments,
  updateLawyerAppointmentStatus,
} from '../../services/appointmentService';
import { formatAppointmentDate } from '../../utils/bookingStatus';

const FILTERS = [
  ['', 'Tất cả'],
  ['PENDING', 'Chờ xác nhận'],
  ['CONFIRMED', 'Đã xác nhận'],
  ['COMPLETED', 'Hoàn thành'],
  ['REJECTED', 'Từ chối'],
  ['CANCELLED', 'Đã hủy'],
];

export default function LawyerDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAppointments(await fetchLawyerAppointments(filter || null));
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Không tải được lịch hẹn.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const statistics = useMemo(() => ({
    total: appointments.length,
    pending: appointments.filter((item) => item.statusCode === 'PENDING').length,
    confirmed: appointments.filter((item) => item.statusCode === 'CONFIRMED').length,
    completed: appointments.filter((item) => item.statusCode === 'COMPLETED').length,
  }), [appointments]);

  const changeStatus = async (appointment, nextStatus) => {
    let reason = null;
    if (['REJECTED', 'CANCELLED'].includes(nextStatus)) {
      reason = window.prompt(nextStatus === 'REJECTED' ? 'Lý do từ chối lịch:' : 'Lý do hủy lịch:');
      if (reason === null) return;
    }
    setUpdatingId(appointment.id);
    setError('');
    try {
      const updated = await updateLawyerAppointmentStatus(appointment.id, nextStatus, reason);
      if (filter && updated.statusCode !== filter) {
        setAppointments((current) => current.filter((item) => item.id !== updated.id));
      } else {
        setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Không cập nhật được trạng thái.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className='min-h-screen bg-slate-50 px-4 py-8'>
      <div className='mx-auto max-w-7xl'>
        <div>
          <p className='text-sm text-law-gold'>Luật sư {user?.full_name || user?.username}</p>
          <h1 className='mt-1 font-serif text-3xl font-bold text-law-navy'>Quản lý lịch tư vấn</h1>
        </div>

        <section className='my-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {[
            ['Tổng lịch', statistics.total],
            ['Chờ xác nhận', statistics.pending],
            ['Đã xác nhận', statistics.confirmed],
            ['Hoàn thành', statistics.completed],
          ].map(([label, value]) => (
            <article key={label} className='rounded-2xl bg-white p-5 shadow-sm'>
              <p className='text-sm text-slate-500'>{label}</p>
              <p className='mt-2 text-3xl font-bold text-law-navy'>{value}</p>
            </article>
          ))}
        </section>

        <div className='mb-5 flex flex-wrap gap-2'>
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type='button'
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === value ? 'bg-law-navy text-white' : 'bg-white text-slate-600 shadow-sm'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p className='mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700'>{error}</p>}

        <section className='overflow-hidden rounded-2xl bg-white shadow-sm'>
          {loading ? (
            <p className='p-8 text-center text-slate-500'>Đang tải lịch hẹn...</p>
          ) : appointments.length === 0 ? (
            <p className='p-10 text-center text-slate-500'>Không có lịch hẹn trong trạng thái này.</p>
          ) : (
            <div className='divide-y divide-slate-100'>
              {appointments.map((appointment) => (
                <article key={appointment.id} className='p-5'>
                  <div className='grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-start'>
                    <div>
                      <p className='text-xs font-semibold uppercase tracking-wide text-law-gold'>{appointment.code}</p>
                      <h2 className='mt-1 text-lg font-semibold text-law-navy'>{appointment.customerName}</h2>
                      <p className='mt-1 text-sm text-slate-500'>{appointment.phone} · {appointment.email}</p>
                    </div>
                    <div>
                      <p className='font-medium text-law-navy'>{formatAppointmentDate(appointment.scheduledAt)}</p>
                      <p className='mt-1 text-sm text-slate-500'>{appointment.durationMinutes} phút</p>
                      <p className='mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700'>{appointment.content}</p>
                      {appointment.cancellationReason && <p className='mt-2 text-sm text-red-600'>Lý do: {appointment.cancellationReason}</p>}
                    </div>
                    <div className='flex min-w-44 flex-col items-start gap-3 lg:items-end'>
                      <BookingStatusBadge status={appointment.statusCode} />
                      <div className='flex flex-wrap gap-2 lg:justify-end'>
                        {appointment.statusCode === 'PENDING' && (
                          <>
                            <button disabled={updatingId === appointment.id} onClick={() => changeStatus(appointment, 'CONFIRMED')} className='rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white'>Xác nhận</button>
                            <button disabled={updatingId === appointment.id} onClick={() => changeStatus(appointment, 'REJECTED')} className='rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600'>Từ chối</button>
                          </>
                        )}
                        {appointment.statusCode === 'CONFIRMED' && (
                          <>
                            <button disabled={updatingId === appointment.id} onClick={() => changeStatus(appointment, 'COMPLETED')} className='rounded-lg bg-law-navy px-3 py-2 text-sm font-semibold text-white'>Hoàn thành</button>
                            <button disabled={updatingId === appointment.id} onClick={() => changeStatus(appointment, 'CANCELLED')} className='rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600'>Hủy lịch</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
