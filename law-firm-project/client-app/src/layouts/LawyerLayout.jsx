import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/lawyer/dashboard', icon: '▦', label: 'Tổng quan' },
  { to: '/lawyer/appointments', icon: '◷', label: 'Lịch tư vấn' },
  { to: '/lawyer/schedule', icon: '▤', label: 'Lịch làm việc' },
  { to: '/lawyer/legal-search', icon: '⌕', label: 'Tra cứu pháp luật' },
  { to: '/lawyer/profile', icon: '○', label: 'Hồ sơ cá nhân' },
];

export default function LawyerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className='flex min-h-screen bg-slate-50'>
      <aside className='fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-law-navy px-4 py-6 text-white shadow-xl'>
        <div className='border-b border-white/10 px-3 pb-6'>
          <p className='font-serif text-xl font-bold'>Cổng Luật sư</p>
          <p className='mt-2 truncate text-sm text-white/60'>{user?.full_name || user?.username}</p>
          <span className='mt-3 inline-flex rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-200'>Tài khoản luật sư</span>
        </div>

        <nav className='mt-6 space-y-1.5'>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-law-gold text-law-navy shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}
            >
              <span className='w-5 text-center text-base' aria-hidden='true'>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className='mt-auto border-t border-white/10 pt-4'>
          <button
            type='button'
            onClick={handleLogout}
            className='flex w-full items-center gap-3 rounded-xl border border-white/15 px-4 py-3 text-left text-sm font-semibold text-white/80 transition hover:border-red-300/40 hover:bg-red-500/20 hover:text-white'
          >
            <span className='w-5 text-center' aria-hidden='true'>↪</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className='ml-64 min-h-screen flex-1 overflow-x-hidden'>
        <Outlet />
      </main>
    </div>
  );
}
