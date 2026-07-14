import { useCallback, useEffect, useState } from 'react';
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '../../services/adminPortalService';

const emptyForm = { name: '', slug: '', description: '', status: 'ACTIVE' };

function createSlug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setCategories(await fetchCategories()); } catch (requestError) { setError(requestError.response?.data?.message || requestError.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm(emptyForm); setEditingId(null); };
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      if (editingId) await updateCategory(editingId, form); else await createCategory(form);
      await load(); reset();
    } catch (requestError) { setError(requestError.response?.data?.message || requestError.message); }
    finally { setSaving(false); }
  };

  const edit = (category) => {
    setEditingId(category.id);
    setForm({ name: category.name, slug: category.slug, description: category.description || '', status: category.status });
  };

  const remove = async (category) => {
    if (!window.confirm(`Xóa danh mục ${category.name}?`)) return;
    try { await deleteCategory(category.id); await load(); } catch (requestError) { setError(requestError.response?.data?.message || requestError.message); }
  };

  return (
    <div>
      <p className='text-sm font-medium text-law-gold'>Phân loại dữ liệu và chuyên môn</p>
      <h1 className='mt-1 font-serif text-3xl font-bold text-law-navy'>Danh mục pháp luật</h1>

      {error && <p className='mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700'>{error}</p>}

      <section className='mt-6 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]'>
        <form onSubmit={submit} className='h-fit rounded-2xl bg-white p-5 shadow-sm'>
          <h2 className='font-bold text-law-navy'>{editingId ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</h2>
          <label className='mt-4 block text-sm text-slate-600'>Tên danh mục
            <input className='input-field mt-1' required value={form.name} onChange={(event) => { const name = event.target.value; setForm({ ...form, name, slug: editingId ? form.slug : createSlug(name) }); }} />
          </label>
          <label className='mt-4 block text-sm text-slate-600'>Slug
            <input className='input-field mt-1 font-mono' required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          </label>
          <label className='mt-4 block text-sm text-slate-600'>Mô tả
            <textarea className='input-field mt-1' rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label className='mt-4 block text-sm text-slate-600'>Trạng thái
            <select className='input-field mt-1' value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value='ACTIVE'>Hoạt động</option><option value='INACTIVE'>Tạm ẩn</option></select>
          </label>
          <div className='mt-5 flex gap-2'><button className='btn-primary' disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu danh mục'}</button>{editingId && <button type='button' onClick={reset} className='btn-secondary'>Hủy</button>}</div>
        </form>

        <div className='overflow-x-auto rounded-2xl bg-white p-5 shadow-sm'>
          <table className='w-full min-w-[620px] text-left text-sm'><thead><tr className='border-b text-slate-500'><th className='py-3 pr-4'>Danh mục</th><th className='py-3 pr-4'>Slug</th><th className='py-3 pr-4'>Trạng thái</th><th className='py-3'>Thao tác</th></tr></thead>
            <tbody>{categories.map((category) => <tr key={category.id} className='border-b border-slate-100'><td className='py-4 pr-4'><p className='font-semibold text-law-navy'>{category.name}</p><p className='mt-1 max-w-sm text-xs text-slate-500'>{category.description || 'Chưa có mô tả'}</p></td><td className='py-4 pr-4 font-mono text-xs'>{category.slug}</td><td className='py-4 pr-4'><span className={`rounded-full px-3 py-1 text-xs font-semibold ${category.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{category.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ẩn'}</span></td><td className='py-4 space-x-3'><button onClick={() => edit(category)} className='font-semibold text-law-gold'>Sửa</button><button onClick={() => remove(category)} className='font-semibold text-red-600'>Xóa</button></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
