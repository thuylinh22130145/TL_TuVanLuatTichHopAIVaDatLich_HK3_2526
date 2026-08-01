import { Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import LawyerLayout from '../layouts/LawyerLayout';
import PrivateRoute from './PrivateRoute';
import LandingPage from '../pages/public/LandingPage';

import ChatPage from '../pages/public/ChatPage';
import LawyerInfoPage from '../pages/public/LawyerInfoPage';
import LawyerRegisterPage from '../pages/public/RequestLawyerPage';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

import AdminOverview from '../pages/admin/AdminOverview';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage';
import AdminSectionPage from '../pages/admin/AdminSectionPage';
import LawyersTab from '../pages/admin/tabs/LawyersTab';
import LawyerApplicationsTab from '../pages/admin/tabs/LawyerApplicationsTab';
import AppointmentsTab from '../pages/admin/tabs/AppointmentsTab';
import DocumentsTab from '../pages/admin/tabs/DocumentsTab';
import LawyerDashboard from '../pages/lawyer/LawyerDashboard';
import LawyerOverview from '../pages/lawyer/LawyerOverview';
import LawyerSchedulePage from '../pages/lawyer/LawyerSchedulePage';
import LawyerLegalSearchPage from '../pages/lawyer/LawyerLegalSearchPage';
import LawyerProfilePage from '../pages/lawyer/LawyerProfilePage';
import HomePage from '../pages/user/HomePage';

export const appRoutes = [
 
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'tu-van',
        element: <ChatPage />,
      },
      {
        path: 'luat-su',
        element: <LawyerInfoPage />,
      },
      {
        path: 'dang-ky-luat-su',
        element: <LawyerRegisterPage />,
      },
    ],
  },

  
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },

 
  { element: <PrivateRoute allowedRoles={['USER']} />, children: [{ path: '/user/home', element: <HomePage /> }] },
  {
    element: <PrivateRoute allowedRoles={['LAWYER']} />,
    children: [
      {
        path: '/lawyer',
        element: <LawyerLayout />,
        children: [
          { index: true, element: <Navigate to='/lawyer/dashboard' replace /> },
          { path: 'dashboard', element: <LawyerOverview /> },
          { path: 'appointments', element: <LawyerDashboard /> },
          { path: 'schedule', element: <LawyerSchedulePage /> },
          { path: 'legal-search', element: <LawyerLegalSearchPage /> },
          { path: 'profile', element: <LawyerProfilePage /> },
        ],
      },
    ],
  },
  {
    element: <PrivateRoute allowedRoles={['ADMIN']} />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to='/admin/dashboard' replace /> },
          { path: 'dashboard', element: <AdminOverview /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'categories', element: <AdminCategoriesPage /> },
          { path: 'lawyers', element: <AdminSectionPage eyebrow='Đội ngũ chuyên môn' title='Quản lý luật sư' description='Theo dõi hồ sơ, chuyên môn và trạng thái sẵn sàng của luật sư.'><LawyersTab /></AdminSectionPage> },
          { path: 'lawyer-applications', element: <AdminSectionPage eyebrow='Quy trình phê duyệt' title='Hồ sơ đăng ký luật sư' description='Duyệt hoặc từ chối yêu cầu tham gia hệ thống của luật sư.'><LawyerApplicationsTab /></AdminSectionPage> },
          { path: 'appointments', element: <AdminSectionPage eyebrow='Điều phối tư vấn' title='Quản lý lịch tư vấn' description='Theo dõi và điều chỉnh lịch hẹn giữa khách hàng với luật sư.'><AppointmentsTab /></AdminSectionPage> },
          { path: 'documents', element: <AdminSectionPage eyebrow='Knowledge Base' title='Tài liệu pháp luật và RAG' description='Quản lý dữ liệu làm căn cứ cho Chatbot AI và chức năng tra cứu.'><DocumentsTab /></AdminSectionPage> },
        ],
      },
    ],
  },

  {
    path: '*',
    element: (
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="text-2xl font-bold">
          404 - Trang không tồn tại
        </h1>
      </div>
    ),
  },
];
