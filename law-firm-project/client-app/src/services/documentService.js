import { apiClient } from './api';
import { API_PATHS, unwrapData } from './apiHelpers';

export async function fetchDocuments() {
  const res = await apiClient.get(API_PATHS.admin.documents);
  const rows = unwrapData(res) || [];
  return Array.isArray(rows) ? rows : [];
}

export async function fetchDocumentById(docId) {
  const res = await apiClient.get(`${API_PATHS.admin.documents}/${docId}`);
  return unwrapData(res);
}

export async function createDocument(payload) {
  const res = await apiClient.post(API_PATHS.admin.documents, payload);
  return unwrapData(res);
}

export async function uploadPdfDocument(payload, file) {
  const form = new FormData();
  form.append('doc_id', payload.doc_id);
  form.append('title', payload.title);
  form.append('specialization', payload.specialization);
  form.append('file', file);

  const res = await apiClient.post(`${API_PATHS.admin.documents}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return unwrapData(res);
}

export async function updateDocument(docId, payload) {
  const res = await apiClient.put(
    `${API_PATHS.admin.documents}/${docId}`,
    payload
  );
  return unwrapData(res);
}

export async function deleteDocument(docId) {
  await apiClient.delete(`${API_PATHS.admin.documents}/${docId}`);
  return true;
}
