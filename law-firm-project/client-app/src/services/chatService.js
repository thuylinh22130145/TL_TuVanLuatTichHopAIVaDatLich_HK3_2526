import { apiClient } from './api';
import { API_PATHS, unwrapData } from './apiHelpers';
import { mapChatFromApi } from './mappers';

/** Tin nhắn chào cố định — không dùng mock store */
export const WELCOME_MESSAGE = {
  id: 'msg-welcome',
  role: 'assistant',
  content:
    'Xin chào! Tôi là Chatbot AI của Văn phòng Luật. Hãy mô tả ngắn vấn đề pháp lý cần tư vấn.',
  timestamp: new Date().toISOString(),
  suggestBooking: false,
};

export function getInitialChatMessages() {
  return [WELCOME_MESSAGE];
}

/** Gọi server-api → server-ai (chỉ bước sinh câu trả lời AI là mock trên server-ai) */
export async function sendChatMessage(text, messages = [], sessionId = null) {
  const conversationHistory = messages
    .filter((message) => message.id !== 'msg-welcome' && ['user', 'assistant'].includes(message.role))
    .slice(-12)
    .map((message) => ({ role: message.role, content: message.content }));
  const res = await apiClient.post(API_PATHS.public.chat, {
    message: text,
    conversation_history: conversationHistory,
    session_id: sessionId,
  });
  return { ...mapChatFromApi(unwrapData(res)), consultationSummary: text };
}

export async function fetchChatSessions() {
  const res = await apiClient.get(API_PATHS.customer.chatSessions);
  return unwrapData(res) || [];
}

export async function fetchChatSession(id) {
  const res = await apiClient.get(`${API_PATHS.customer.chatSessions}/${id}`);
  return unwrapData(res);
}

export async function deleteChatSession(id) {
  await apiClient.delete(`${API_PATHS.customer.chatSessions}/${id}`);
  return true;
}
