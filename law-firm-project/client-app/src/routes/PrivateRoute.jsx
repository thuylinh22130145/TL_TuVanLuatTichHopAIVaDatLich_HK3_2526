import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const homeByRole = {
  ADMIN: '/admin/dashboard',
  LAWYER: '/lawyer/dashboard',
  USER: '/user/home',
};

export default function PrivateRoute({ allowedRoles = [] }) {
  const { authenticated, user } = useAuth();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to={homeByRole[user?.role] || '/'} replace />;
  }

  return <Outlet />;
}
