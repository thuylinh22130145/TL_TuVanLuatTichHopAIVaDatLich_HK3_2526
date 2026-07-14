import { apiClient } from './api';
import { API_PATHS, unwrapData } from './apiHelpers';
import { mapLawyerFromApi, mapLawyerToApi } from './mappers';

export async function fetchPublicLawyers() {
  const res = await apiClient.get(API_PATHS.public.lawyers);
  const rows = unwrapData(res) || [];
  return rows.map(mapLawyerFromApi);
}

export async function fetchAdminLawyers() {
  const res = await apiClient.get(API_PATHS.admin.lawyers);
  const rows = unwrapData(res) || [];
  return rows.map(mapLawyerFromApi);
}

export async function fetchLawyerById(id) {
  const res = await apiClient.get(`${API_PATHS.admin.lawyers}/${id}`);
  return mapLawyerFromApi(unwrapData(res));
}

export async function createLawyer(payload) {
  const res = await apiClient.post(
    API_PATHS.admin.lawyers,
    mapLawyerToApi(payload)
  );
  return mapLawyerFromApi(unwrapData(res));
}

export async function submitLawyerApplication(payload) {
  const res = await apiClient.post(API_PATHS.public.lawyerApplications, payload);
  return unwrapData(res);
}

export async function fetchLawyerApplications() {
  const res = await apiClient.get(API_PATHS.admin.lawyerApplications);
  return unwrapData(res) || [];
}

export async function approveLawyerApplication(id, review_note = null) {
  const res = await apiClient.post(
    `${API_PATHS.admin.lawyerApplications}/${id}/approve`,
    { review_note }
  );
  return unwrapData(res);
}

export async function rejectLawyerApplication(id, review_note = null) {
  const res = await apiClient.post(
    `${API_PATHS.admin.lawyerApplications}/${id}/reject`,
    { review_note }
  );
  return unwrapData(res);
}

export async function updateLawyer(id, updates) {
  const res = await apiClient.put(
    `${API_PATHS.admin.lawyers}/${id}`,
    mapLawyerToApi(updates)
  );
  return mapLawyerFromApi(unwrapData(res));
}

export async function deleteLawyer(id) {
  await apiClient.delete(`${API_PATHS.admin.lawyers}/${id}`);
  return true;
}
