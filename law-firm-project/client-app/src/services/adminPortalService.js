import { apiClient } from './api';
import { API_PATHS, unwrapData } from './apiHelpers';

export async function fetchAdminOverview() {
  return unwrapData(await apiClient.get(API_PATHS.admin.overview));
}

export async function fetchUsers(params = {}) {
  return unwrapData(await apiClient.get(API_PATHS.admin.users, { params })) || [];
}

export async function updateUserStatus(id, status) {
  return unwrapData(await apiClient.patch(`${API_PATHS.admin.users}/${id}/status`, { status }));
}

export async function fetchCategories() {
  return unwrapData(await apiClient.get(API_PATHS.admin.categories)) || [];
}

export async function createCategory(payload) {
  return unwrapData(await apiClient.post(API_PATHS.admin.categories, payload));
}

export async function updateCategory(id, payload) {
  return unwrapData(await apiClient.put(`${API_PATHS.admin.categories}/${id}`, payload));
}

export async function deleteCategory(id) {
  await apiClient.delete(`${API_PATHS.admin.categories}/${id}`);
}
