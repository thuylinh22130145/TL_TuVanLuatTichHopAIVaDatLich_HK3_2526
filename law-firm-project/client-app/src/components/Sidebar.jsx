import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ITEMS = [
  ['/admin/dashboard', '▦', 'Tổng quan'],
  ['/admin/users', '◎', 'Tài khoản'],
  ['/admin/lawyers', '♜', 'Luật sư'],
  ['/admin/lawyer-applications', '▧', 'Hồ sơ đăng ký'],
  ['/admin/appointments', '◷', 'Lịch tư vấn'],
  ['/admin/categories', '▤', 'Danh mục pháp luật'],
  ['/admin/documents', '▥', 'Tài liệu RAG / AI'],
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <aside className='fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-law-navy px-4 py-6 text-white shadow-xl'>
      <div className='border-b border-white/10 px-3 pb-6'>
        <p className='font-serif text-xl font-bold'>Cổng Quản trị</p>
        <p className='mt-2 truncate text-sm text-white/60'>{user?.full_name || user?.username}</p>
        <span className='mt-3 inline-flex rounded-full bg-law-gold/15 px-2.5 py-1 text-xs font-medium text-law-gold'>Quản trị viên</span>
      </div>
      <nav className='mt-6 space-y-1'>
        {ITEMS.map(([to, icon, label]) => <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-law-gold text-law-navy' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}><span className='w-5 text-center'>{icon}</span>{label}</NavLink>)}
      </nav>
      <button onClick={signOut} className='mt-auto flex items-center gap-3 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-red-500/20 hover:text-white'><span>↪</span>Đăng xuất</button>
    </aside>
  );
}
