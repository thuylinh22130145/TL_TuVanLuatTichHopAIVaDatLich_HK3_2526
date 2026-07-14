import { apiClient } from './api';

const authService = {
  async login(username, password) {
    const res = await apiClient.post('/auth/login', {
      username,
      password,
    });

    return res.data.data;
  },

  async register(data) {
    const res = await apiClient.post('/auth/register', data);

    return res.data.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin_token');
  },
};

export default authService;