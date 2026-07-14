import axios from 'axios';
import { env } from '../config/env.js';

function aiClient() {
  const base = env.ai.serviceUrl.replace(/\/$/, '');
  return axios.create({
    baseURL: `${base}/api/v1/documents`,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': env.ai.apiKey,
    },
  });
}

export async function listDocuments() {
  const { data } = await aiClient().get('');
  return data;
}

export async function getDocument(docId) {
  const { data } = await aiClient().get(`/${docId}`);
  return data;
}

export async function createDocument(payload) {
  const { data } = await aiClient().post('', payload);
  return data;
}

export async function updateDocument(docId, payload) {
  const { data } = await aiClient().put(`/${docId}`, payload);
  return data;
}

export async function deleteDocument(docId) {
  await aiClient().delete(`/${docId}`);
  return true;
}
