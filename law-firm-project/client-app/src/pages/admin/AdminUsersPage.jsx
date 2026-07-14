import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchUsers, updateUserStatus } from '../../services/adminPortalService';

const ROLE_LABELS = { ADMIN: 'Quản trị viên', LAWYER: 'Luật sư', USER: 'Khách hàng' };

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await fetchUsers(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))));
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const toggleStatus = async (account) => {
    const nextStatus = account.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!window.confirm(`${nextStatus === 'INACTIVE' ? 'Khóa' : 'Mở khóa'} tài khoản ${account.username}?`)) return;
    setUpdatingId(account.id);
    setError('');
    try {
      const updated = await updateUserStatus(account.id, nextStatus);
      setUsers((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <p className='text-sm font-medium text-law-gold'>Phân quyền và trạng thái</p>
      <h1 className='mt-1 font-serif text-3xl font-bold text-law-navy'>Quản lý tài khoản</h1>

      <section className='mt-6 grid gap-3 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-[1fr_200px_200px]'>
        <input className='input-field' placeholder='Tìm tên, username hoặc email...' value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <select className='input-field' value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}>
          <option value=''>Tất cả vai trò</option>
          <option value='USER'>Khách hàng</option>
          <option value='LAWYER'>Luật sư</option>
          <option value='ADMIN'>Quản trị viên</option>
        </select>
        <select className='input-field' value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value=''>Tất cả trạng thái</option>
          <option value='ACTIVE'>Đang hoạt động</option>
          <option value='INACTIVE'>Đã khóa</option>
        </select>
      </section>

      {error && <p className='mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700'>{error}</p>}

      <section className='mt-6 overflow-x-auto rounded-2xl bg-white p-5 shadow-sm'>
        {loading ? <p className='py-8 text-center text-slate-500'>Đang tải tài khoản...</p> : (
          <table className='w-full min-w-[850px] text-left text-sm'>
            <thead><tr className='border-b text-slate-500'><th className='py-3 pr-4'>Tài khoản</th><th className='py-3 pr-4'>Liên hệ</th><th className='py-3 pr-4'>Vai trò</th><th className='py-3 pr-4'>Thông tin luật sư</th><th className='py-3 pr-4'>Trạng thái</th><th className='py-3'>Thao tác</th></tr></thead>
            <tbody>{users.map((account) => (
              <tr key={account.id} className='border-b border-slate-100'>
                <td className='py-4 pr-4'><p className='font-semibold text-law-navy'>{account.full_name}</p><p className='text-xs text-slate-500'>@{account.username}</p></td>
                <td className='py-4 pr-4'><p>{account.email}</p><p className='text-xs text-slate-500'>{account.phone || 'Chưa có SĐT'}</p></td>
                <td className='py-4 pr-4'><span className='rounded-full bg-law-gold/10 px-3 py-1 text-xs font-semibold text-law-gold'>{ROLE_LABELS[account.role]}</span></td>
                <td className='py-4 pr-4 text-xs text-slate-600'>{account.lawyerProfile ? <><p>{account.lawyerProfile.specialization}</p><p>{account.lawyerProfile.availability_status}</p></> : '—'}</td>
                <td className='py-4 pr-4'><span className={`rounded-full px-3 py-1 text-xs font-semibold ${account.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{account.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}</span></td>
                <td className='py-4'><button disabled={updatingId === account.id || account.id === currentUser?.id} onClick={() => toggleStatus(account)} className={`text-sm font-semibold disabled:cursor-not-allowed disabled:text-slate-300 ${account.status === 'ACTIVE' ? 'text-red-600' : 'text-emerald-600'}`}>{account.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {!loading && !users.length && <p className='py-8 text-center text-slate-500'>Không tìm thấy tài khoản.</p>}
      </section>
    </div>
  );
}
