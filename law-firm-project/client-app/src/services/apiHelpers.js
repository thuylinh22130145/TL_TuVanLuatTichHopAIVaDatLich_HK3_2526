/** Trích payload từ response chuẩn { success, data } của server-api */
export function unwrapData(response) {
  const body = response?.data;
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data;
  }
  return body;
}

export const API_PATHS = {
  public: {
    lawyers: '/public/lawyers',
    lawyerApplications: '/public/lawyer-applications',
    bookings: '/public/bookings',
    chat: '/public/chat',
  },
  admin: {
    login: '/admin/auth/login',
    lawyers: '/admin/lawyers',
    lawyerApplications: '/admin/lawyer-applications',
    bookings: '/admin/bookings',
    documents: '/admin/documents',
    overview: '/admin/overview',
    users: '/admin/users',
    categories: '/admin/categories',
  },
  customer: {
    bookings: '/customer/bookings',
  },
  lawyer: {
    bookings: '/lawyer/bookings',
    profile: '/lawyer/profile',
    schedules: '/lawyer/schedules',
  },
};
