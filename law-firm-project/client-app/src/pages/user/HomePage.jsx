import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import { useAuth } from '../../context/AuthContext';
import {
  cancelCustomerAppointment,
  fetchCustomerAppointments,
  updateCustomerAppointment,
} from '../../services/appointmentService';
import { formatAppointmentDate } from '../../utils/bookingStatus';
import './HomePage.css';

function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function HomePage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingSuccess, setBookingSuccess] = useState(() => location.state?.bookingSuccess || null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAppointments(await fetchCustomerAppointments());
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Không tải được lịch hẹn.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    if (location.state?.bookingSuccess) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const statistics = useMemo(() => ({
    total: appointments.length,
    pending: appointments.filter((item) => item.statusCode === 'PENDING').length,
    confirmed: appointments.filter((item) => item.statusCode === 'CONFIRMED').length,
  }), [appointments]);

  const startEditing = (appointment) => {
    setEditing({
      id: appointment.id,
      lawyerId: appointment.lawyerId,
      lawyerName: appointment.lawyerName,
      scheduledAt: toLocalInput(appointment.scheduledAt),
      durationMinutes: appointment.durationMinutes,
      phone: appointment.phone,
      content: appointment.content,
    });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await updateCustomerAppointment(editing.id, editing);
      setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditing(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Không cập nhật được lịch hẹn.');
    } finally {
      setSaving(false);
    }
  };

  const cancelAppointment = async (appointment) => {
    if (!window.confirm(`Bạn có chắc muốn hủy lịch ${appointment.code}?`)) return;
    const reason = window.prompt('Lý do hủy lịch (không bắt buộc):') || null;
    setError('');
    try {
      const updated = await cancelCustomerAppointment(appointment.id, reason);
      setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Không hủy được lịch hẹn.');
    }
  };

  return (
    <main className='min-h-screen bg-slate-50 px-4 py-8'>
      <div className='mx-auto max-w-6xl'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <p className='text-sm text-law-gold'>Xin chào, {user?.full_name || user?.username}</p>
            <h1 className='mt-1 font-serif text-3xl font-bold text-law-navy'>Lịch tư vấn của tôi</h1>
          </div>
          <Link to='/luat-su' className='btn-primary'>Đặt lịch mới</Link>
        </div>

        {bookingSuccess && (
          <div className='booking-success-notice' role='status'>
            <div className='booking-success-content'>
              <span className='booking-success-icon' aria-hidden='true'>✓</span>
              <div>
                <p className='booking-success-title'>Đặt lịch tư vấn thành công!</p>
                <p className='booking-success-message'>
                  Yêu cầu tư vấn với <strong>{bookingSuccess.lawyerName}</strong> đã được ghi nhận
                  {bookingSuccess.code ? <> với mã <strong>{bookingSuccess.code}</strong></> : null}.
                  {' '}Bạn có thể theo dõi trạng thái lịch hẹn ngay bên dưới.
                </p>
              </div>
            </div>
            <button type='button' onClick={() => setBookingSuccess(null)} className='booking-success-close' aria-label='Đóng thông báo'>×</button>
          </div>
        )}

        <section className='my-6 grid gap-4 sm:grid-cols-3'>
          {[
            ['Tổng lịch hẹn', statistics.total],
            ['Chờ xác nhận', statistics.pending],
            ['Đã xác nhận', statistics.confirmed],
          ].map(([label, value]) => (
            <article key={label} className='rounded-2xl bg-white p-5 shadow-sm'>
              <p className='text-sm text-slate-500'>{label}</p>
              <p className='mt-2 text-3xl font-bold text-law-navy'>{value}</p>
            </article>
          ))}
        </section>

        {error && <p className='mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700'>{error}</p>}

        {editing && (
          <form onSubmit={saveEdit} className='mb-6 rounded-2xl border border-law-gold/30 bg-white p-5 shadow-sm'>
            <div className='flex items-center justify-between gap-3'>
              <h2 className='font-semibold text-law-navy'>Chỉnh sửa lịch với {editing.lawyerName}</h2>
              <button type='button' onClick={() => setEditing(null)} className='text-sm text-slate-500'>Đóng</button>
            </div>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              <label className='text-sm text-slate-600'>
                Thời gian
                <input className='input-field mt-1' type='datetime-local' required value={editing.scheduledAt} onChange={(event) => setEditing({ ...editing, scheduledAt: event.target.value })} />
              </label>
              <label className='text-sm text-slate-600'>
                Thời lượng
                <select className='input-field mt-1' value={editing.durationMinutes} onChange={(event) => setEditing({ ...editing, durationMinutes: Number(event.target.value) })}>
                  <option value={30}>30 phút</option>
                  <option value={60}>60 phút</option>
                  <option value={90}>90 phút</option>
                  <option value={120}>120 phút</option>
                </select>
              </label>
              <label className='text-sm text-slate-600'>
                Số điện thoại
                <input className='input-field mt-1' required value={editing.phone || ''} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} />
              </label>
              <label className='text-sm text-slate-600 sm:col-span-2'>
                Nội dung tư vấn
                <textarea className='input-field mt-1' rows={4} required value={editing.content} onChange={(event) => setEditing({ ...editing, content: event.target.value })} />
              </label>
            </div>
            <button className='btn-primary mt-4' disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
          </form>
        )}

        <section className='overflow-hidden rounded-2xl bg-white shadow-sm'>
          {loading ? (
            <p className='p-8 text-center text-slate-500'>Đang tải lịch hẹn...</p>
          ) : appointments.length === 0 ? (
            <div className='p-10 text-center'>
              <p className='text-slate-500'>Bạn chưa có lịch tư vấn nào.</p>
              <Link to='/luat-su' className='mt-4 inline-block font-semibold text-law-gold'>Chọn luật sư để đặt lịch</Link>
            </div>
          ) : (
            <div className='divide-y divide-slate-100'>
              {appointments.map((appointment) => (
                <article key={appointment.id} className='p-5'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div>
                      <p className='text-xs font-medium uppercase tracking-wide text-law-gold'>{appointment.code}</p>
                      <h2 className='mt-1 text-lg font-semibold text-law-navy'>{appointment.lawyerName}</h2>
                      <p className='mt-1 text-sm text-slate-500'>{formatAppointmentDate(appointment.scheduledAt)} · {appointment.durationMinutes} phút</p>
                    </div>
                    <BookingStatusBadge status={appointment.statusCode} />
                  </div>
                  <p className='mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700'>{appointment.content}</p>
                  {appointment.cancellationReason && <p className='mt-2 text-sm text-red-600'>Lý do: {appointment.cancellationReason}</p>}
                  <div className='mt-4 flex flex-wrap gap-2'>
                    {appointment.statusCode === 'PENDING' && (
                      <button type='button' onClick={() => startEditing(appointment)} className='rounded-lg border border-law-navy/20 px-3 py-2 text-sm font-semibold text-law-navy'>Chỉnh sửa</button>
                    )}
                    {['PENDING', 'CONFIRMED'].includes(appointment.statusCode) && (
                      <button type='button' onClick={() => cancelAppointment(appointment)} className='rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600'>Hủy lịch</button>
                    )}
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
