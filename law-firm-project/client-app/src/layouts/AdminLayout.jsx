import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AdminLayout() {
  return (
    <div className='min-h-screen bg-slate-50'>
      <Sidebar />
      <main className='ml-64 min-h-screen overflow-x-hidden p-6 lg:p-10'><Outlet /></main>
    </div>
  );
}
