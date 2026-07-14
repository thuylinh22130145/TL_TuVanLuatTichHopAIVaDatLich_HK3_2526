import { Navigate, Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout() {
  const { user } = useAuth();

  if (user?.role === 'LAWYER') {
    return <Navigate to='/lawyer/dashboard' replace />;
  }
  if (user?.role === 'ADMIN') {
    return <Navigate to='/admin/dashboard' replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
