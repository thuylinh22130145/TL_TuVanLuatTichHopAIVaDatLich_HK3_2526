import axios from 'axios';
import { Blob } from 'node:buffer';

import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

function aiClient(contentType = 'application/json') {
  const base = env.ai.serviceUrl.replace(/\/$/, '');
  const headers = { 'X-API-Key': env.ai.apiKey };
  if (contentType) headers['Content-Type'] = contentType;
  return axios.create({
    baseURL: `${base}/api/v1/documents`,
    timeout: 600000,
    maxBodyLength: 30 * 1024 * 1024,
    maxContentLength: 30 * 1024 * 1024,
    headers,
  });
}

function forwardAiError(error) {
  const statusCode = error.response?.status || 502;
  const detail = error.response?.data?.detail;
  const message = Array.isArray(detail)
    ? detail.map((item) => item.msg).join('; ')
    : detail || error.message || 'Server-AI không phản hồi';
  throw new ApiError(statusCode, message);
}

export async function listDocuments() {
  try {
    const { data } = await aiClient().get('');
    return data;
  } catch (error) {
    forwardAiError(error);
  }
}

export async function getDocument(docId) {
  try {
    const { data } = await aiClient().get(`/${docId}`);
    return data;
  } catch (error) {
    forwardAiError(error);
  }
}

export async function createDocument(payload) {
  try {
    const { data } = await aiClient().post('', payload);
    return data;
  } catch (error) {
    forwardAiError(error);
  }
}

export async function uploadPdfDocument(payload, file) {
  const form = new FormData();
  form.append('doc_id', payload.doc_id);
  form.append('title', payload.title);
  form.append('specialization', payload.specialization);
  form.append('file', new Blob([file.buffer], { type: 'application/pdf' }), file.originalname);

  try {
    const { data } = await aiClient(null).post('/upload', form);
    return data;
  } catch (error) {
    forwardAiError(error);
  }
}

export async function updateDocument(docId, payload) {
  try {
    const { data } = await aiClient().put(`/${docId}`, payload);
    return data;
  } catch (error) {
    forwardAiError(error);
  }
}

export async function deleteDocument(docId) {
  try {
    await aiClient().delete(`/${docId}`);
    return true;
  } catch (error) {
    forwardAiError(error);
  }
}
