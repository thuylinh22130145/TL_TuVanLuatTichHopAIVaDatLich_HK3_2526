import { useEffect, useState } from 'react';
import { fetchLawyerProfile, updateLawyerProfile } from '../../services/lawyerPortalService';

export default function LawyerProfilePage() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLawyerProfile()
      .then((data) => {
        const lawyer = data.lawyer;
        setForm({
          full_name: lawyer.full_name || '',
          title: lawyer.title || '',
          phone: lawyer.phone || '',
          email: lawyer.email || '',
          specialization: lawyer.specialization || '',
          experience_years: lawyer.experience_years || 0,
          availability_status: lawyer.availability_status || 'AVAILABLE',
          bio: lawyer.bio || '',
        });
      })
      .catch((requestError) => setError(requestError.response?.data?.message || requestError.message));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const data = await updateLawyerProfile({ ...form, experience_years: Number(form.experience_years) });
      setForm((current) => ({ ...current, ...data.lawyer }));
      setMessage('Đã cập nhật hồ sơ cá nhân.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Không cập nhật được hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='px-6 py-8 lg:px-10'>
      <p className='text-sm font-medium text-law-gold'>Quản lý tài khoản</p>
      <h1 className='mt-1 font-serif text-3xl font-bold text-law-navy'>Hồ sơ luật sư</h1>
      <p className='mt-2 text-sm text-slate-500'>Thông tin này được hiển thị cho khách hàng khi xem danh sách luật sư.</p>

      {error && <p className='mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700'>{error}</p>}
      {message && <p className='mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</p>}

      {!form ? <p className='mt-8 text-slate-500'>Đang tải hồ sơ...</p> : (
        <form onSubmit={submit} className='mt-6 max-w-4xl rounded-2xl bg-white p-6 shadow-sm'>
          <div className='grid gap-5 sm:grid-cols-2'>
            <label className='text-sm text-slate-600'>Họ và tên
              <input className='input-field mt-1' required value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
            </label>
            <label className='text-sm text-slate-600'>Chức danh
              <input className='input-field mt-1' value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>
            <label className='text-sm text-slate-600'>Email
              <input className='input-field mt-1 bg-slate-50' value={form.email} disabled />
            </label>
            <label className='text-sm text-slate-600'>Số điện thoại
              <input className='input-field mt-1' value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label className='text-sm text-slate-600'>Chuyên môn
              <input className='input-field mt-1' required value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} />
            </label>
            <label className='text-sm text-slate-600'>Số năm kinh nghiệm
              <input type='number' min='0' className='input-field mt-1' value={form.experience_years} onChange={(event) => setForm({ ...form, experience_years: event.target.value })} />
            </label>
            <label className='text-sm text-slate-600'>Trạng thái tư vấn
              <select className='input-field mt-1' value={form.availability_status} onChange={(event) => setForm({ ...form, availability_status: event.target.value })}>
                <option value='AVAILABLE'>Sẵn sàng</option>
                <option value='BUSY'>Đang bận</option>
                <option value='OFFLINE'>Ngoại tuyến</option>
              </select>
            </label>
            <label className='text-sm text-slate-600 sm:col-span-2'>Giới thiệu
              <textarea rows={6} className='input-field mt-1 resize-y' value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
            </label>
          </div>
          <button className='btn-primary mt-5' disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
        </form>
      )}
    </div>
  );
}
