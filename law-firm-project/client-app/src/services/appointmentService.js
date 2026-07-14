import { apiClient } from './api';
import { API_PATHS, unwrapData } from './apiHelpers';
import {
  mapBookingFromApi,
  mapBookingToApi,
  mapPublicBookingResult,
} from './mappers';

export async function fetchAppointments() {
  const res = await apiClient.get(API_PATHS.admin.bookings);
  const rows = unwrapData(res) || [];
  return rows.map(mapBookingFromApi);
}

/** Khách đặt lịch */
export async function createPublicAppointment(payload) {
  const res = await apiClient.post(
    API_PATHS.public.bookings,
    mapBookingToApi(payload, { forPublic: true })
  );
  return mapPublicBookingResult(unwrapData(res));
}

export async function createAppointment(payload) {
  const res = await apiClient.post(
    API_PATHS.admin.bookings,
    mapBookingToApi(payload)
  );
  return mapBookingFromApi(unwrapData(res));
}

export async function updateAppointment(id, updates) {
  const res = await apiClient.put(
    `${API_PATHS.admin.bookings}/${id}`,
    mapBookingToApi(updates)
  );
  return mapBookingFromApi(unwrapData(res));
}

export async function deleteAppointment(id) {
  await apiClient.delete(`${API_PATHS.admin.bookings}/${id}`);
  return true;
}

export async function fetchCustomerAppointments() {
  const res = await apiClient.get(API_PATHS.customer.bookings);
  return (unwrapData(res) || []).map(mapBookingFromApi);
}

export async function createCustomerAppointment(payload) {
  const res = await apiClient.post(
    API_PATHS.customer.bookings,
    mapBookingToApi(payload, { forPublic: true })
  );
  return mapBookingFromApi(unwrapData(res));
}

export async function updateCustomerAppointment(id, updates) {
  const res = await apiClient.put(
    `${API_PATHS.customer.bookings}/${id}`,
    mapBookingToApi(updates, { forPublic: true })
  );
  return mapBookingFromApi(unwrapData(res));
}

export async function cancelCustomerAppointment(id, reason = null) {
  const res = await apiClient.patch(`${API_PATHS.customer.bookings}/${id}/cancel`, { reason });
  return mapBookingFromApi(unwrapData(res));
}

export async function fetchLawyerAppointments(status = null) {
  const res = await apiClient.get(API_PATHS.lawyer.bookings, {
    params: status ? { status } : undefined,
  });
  return (unwrapData(res) || []).map(mapBookingFromApi);
}

export async function updateLawyerAppointmentStatus(id, status, reason = null) {
  const res = await apiClient.patch(`${API_PATHS.lawyer.bookings}/${id}/status`, {
    status,
    reason,
  });
  return mapBookingFromApi(unwrapData(res));
}
