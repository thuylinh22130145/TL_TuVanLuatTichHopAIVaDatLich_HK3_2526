import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../../../context/AppDataContext';

export default function LawyersTab() {
  const { lawyers, lawyerService, refreshLawyers } = useAppData();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = (lawyer) => setForm({
    id: lawyer.id, name: lawyer.name, title: lawyer.title, specialty: lawyer.specialty,
    experience: lawyer.experience, email: lawyer.email, phone: lawyer.phone,
    bio: lawyer.bio, status: lawyer.status, availability: lawyer.availability,
  });

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try { await lawyerService.updateLawyer(form.id, form); await refreshLawyers(); setForm(null); }
    catch (requestError) { setError(requestError.response?.data?.message || requestError.message); }
    finally { setSaving(false); }
  };

  const remove = async (lawyer) => {
    if (!window.confirm(`Xóa hồ sơ luật sư ${lawyer.name}?`)) return;
    try { await lawyerService.deleteLawyer(lawyer.id); await refreshLawyers(); }
    catch (requestError) { setError(requestError.response?.data?.message || requestError.message); }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800'>
        <p>Luật sư mới được tạo thông qua quy trình duyệt hồ sơ để bảo đảm có tài khoản LAWYER hợp lệ.</p>
        <Link to='/admin/lawyer-applications' className='font-semibold underline'>Xem hồ sơ đăng ký</Link>
      </div>
      {error && <p className='rounded-xl bg-red-50 p-3 text-sm text-red-700'>{error}</p>}

      {form && (
        <form onSubmit={submit} className='card grid gap-4 sm:grid-cols-2'>
          <h3 className='font-serif text-lg font-semibold sm:col-span-2'>Cập nhật luật sư</h3>
          <input className='input-field' required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder='Họ tên' />
          <input className='input-field' value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder='Chức danh' />
          <input className='input-field sm:col-span-2' required value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} placeholder='Chuyên môn' />
          <input type='number' min='0' className='input-field' value={form.experience} onChange={(event) => setForm({ ...form, experience: Number(event.target.value) })} />
          <input className='input-field' value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder='Điện thoại' />
          <select className='input-field' value={form.availability} onChange={(event) => setForm({ ...form, availability: event.target.value })}><option value='AVAILABLE'>Sẵn sàng</option><option value='BUSY'>Đang bận</option><option value='OFFLINE'>Ngoại tuyến</option></select>
          <select className='input-field' value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value='active'>Hoạt động</option><option value='inactive'>Tạm ngưng</option></select>
          <textarea className='input-field sm:col-span-2' rows={4} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder='Giới thiệu' />
          <div className='flex gap-2 sm:col-span-2'><button className='btn-primary' disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button><button type='button' onClick={() => setForm(null)} className='btn-secondary'>Hủy</button></div>
        </form>
      )}

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {lawyers.map((lawyer) => (
          <article key={lawyer.id} className='card'>
            <div className='flex items-start justify-between gap-3'><div><h3 className='font-bold text-law-navy'>{lawyer.name}</h3><p className='text-xs text-law-gold'>{lawyer.title}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${lawyer.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{lawyer.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}</span></div>
            <p className='mt-3 text-sm text-slate-700'>{lawyer.specialty}</p>
            <p className='mt-1 text-xs text-slate-500'>{lawyer.experience} năm kinh nghiệm · {lawyer.availability}</p>
            <div className='mt-4 flex gap-3'><button onClick={() => startEdit(lawyer)} className='text-sm font-semibold text-law-gold'>Chỉnh sửa</button><button onClick={() => remove(lawyer)} className='text-sm font-semibold text-red-600'>Xóa</button></div>
          </article>
        ))}
      </div>
    </div>
  );
}
