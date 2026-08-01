import { apiClient } from './api';
import { API_PATHS, unwrapData } from './apiHelpers';

export async function fetchLawyerProfile() {
  const response = await apiClient.get(API_PATHS.lawyer.profile);
  return unwrapData(response);
}

export async function updateLawyerProfile(payload) {
  const response = await apiClient.patch(API_PATHS.lawyer.profile, payload);
  return unwrapData(response);
}

export async function fetchLawyerSchedules() {
  const response = await apiClient.get(API_PATHS.lawyer.schedules);
  return unwrapData(response) || [];
}

export async function saveLawyerSchedules(schedules) {
  const response = await apiClient.put(API_PATHS.lawyer.schedules, { schedules });
  return unwrapData(response) || [];
}

export async function searchLegalKnowledge(query, caseContext = '') {
  const response = await apiClient.post(API_PATHS.lawyer.legalSearch, {
    query,
    case_context: caseContext || undefined,
  });
  return unwrapData(response);
}
