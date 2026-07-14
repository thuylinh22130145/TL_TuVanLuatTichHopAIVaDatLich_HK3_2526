import { apiClient } from './api';
import { API_PATHS, unwrapData } from './apiHelpers';
import { mapChatFromApi } from './mappers';

/** Tin nhắn chào cố định — không dùng mock store */
export const WELCOME_MESSAGE = {
  id: 'msg-welcome',
  role: 'assistant',
  content:
    'Xin chào! Tôi là trợ lý AI của Văn phòng Luật. Hãy mô tả ngắn vấn đề pháp lý cần tư vấn.',
  timestamp: new Date().toISOString(),
  suggestBooking: false,
};

export function getInitialChatMessages() {
  return [WELCOME_MESSAGE];
}

/** Gọi server-api → server-ai (chỉ bước sinh câu trả lời AI là mock trên server-ai) */
export async function sendChatMessage(text) {
  const res = await apiClient.post(API_PATHS.public.chat, { message: text });
  return mapChatFromApi(unwrapData(res));
}
