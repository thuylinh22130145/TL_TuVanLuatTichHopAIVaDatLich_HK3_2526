import { useEffect, useState } from 'react';
import { fetchLawyerSchedules, saveLawyerSchedules } from '../../services/lawyerPortalService';

const DAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const emptySlot = () => ({ day_of_week: 1, start_time: '08:00', end_time: '17:00', is_available: true });

export default function LawyerSchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLawyerSchedules()
      .then((rows) => setSchedules(rows.map((row) => ({
        day_of_week: row.day_of_week,
        start_time: row.start_time.slice(0, 5),
        end_time: row.end_time.slice(0, 5),
        is_available: row.is_available,
      }))))
      .catch((requestError) => setError(requestError.response?.data?.message || requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const updateSlot = (index, field, value) => {
    setSchedules((current) => current.map((slot, slotIndex) => slotIndex === index ? { ...slot, [field]: value } : slot));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const rows = await saveLawyerSchedules(schedules);
      setSchedules(rows.map((row) => ({ ...row, start_time: row.start_time.slice(0, 5), end_time: row.end_time.slice(0, 5) })));
      setMessage('Đã lưu lịch làm việc.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Không lưu được lịch làm việc.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='px-6 py-8 lg:px-10'>
      <p className='text-sm font-medium text-law-gold'>Thiết lập khả dụng</p>
      <h1 className='mt-1 font-serif text-3xl font-bold text-law-navy'>Lịch làm việc</h1>
      <p className='mt-2 max-w-2xl text-sm text-slate-500'>Thiết lập các khung giờ nhận tư vấn trong tuần. Hệ thống sẽ dùng thông tin này để hỗ trợ khách hàng chọn lịch phù hợp.</p>

      {error && <p className='mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700'>{error}</p>}
      {message && <p className='mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</p>}

      <section className='mt-6 rounded-2xl bg-white p-6 shadow-sm'>
        {loading ? <p className='py-8 text-center text-slate-500'>Đang tải...</p> : (
          <div className='space-y-3'>
            {schedules.map((slot, index) => (
              <div key={`${slot.day_of_week}-${index}`} className='grid items-end gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[1.2fr_1fr_1fr_auto_auto]'>
                <label className='text-sm text-slate-600'>Ngày
                  <select className='input-field mt-1' value={slot.day_of_week} onChange={(event) => updateSlot(index, 'day_of_week', Number(event.target.value))}>
                    {DAYS.map((day, dayIndex) => <option key={day} value={dayIndex}>{day}</option>)}
                  </select>
                </label>
                <label className='text-sm text-slate-600'>Bắt đầu
                  <input type='time' className='input-field mt-1' value={slot.start_time} onChange={(event) => updateSlot(index, 'start_time', event.target.value)} />
                </label>
                <label className='text-sm text-slate-600'>Kết thúc
                  <input type='time' className='input-field mt-1' value={slot.end_time} onChange={(event) => updateSlot(index, 'end_time', event.target.value)} />
                </label>
                <label className='flex h-11 items-center gap-2 text-sm text-slate-600'>
                  <input type='checkbox' checked={slot.is_available} onChange={(event) => updateSlot(index, 'is_available', event.target.checked)} /> Nhận lịch
                </label>
                <button type='button' onClick={() => setSchedules((current) => current.filter((_, slotIndex) => slotIndex !== index))} className='h-11 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600'>Xóa</button>
              </div>
            ))}
            {!schedules.length && <p className='py-8 text-center text-sm text-slate-500'>Chưa thiết lập lịch làm việc.</p>}
          </div>
        )}

        <div className='mt-5 flex flex-wrap gap-3'>
          <button type='button' onClick={() => setSchedules((current) => [...current, emptySlot()])} className='rounded-lg border border-law-navy/20 px-4 py-2 text-sm font-semibold text-law-navy'>Thêm khung giờ</button>
          <button type='button' onClick={save} disabled={saving || loading} className='btn-primary'>{saving ? 'Đang lưu...' : 'Lưu lịch làm việc'}</button>
        </div>
      </section>
    </div>
  );
}
