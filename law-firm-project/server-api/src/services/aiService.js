import axios from 'axios';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export async function consultWithAI(message, caseContext = null) {
  const base = env.ai.serviceUrl.replace(/\/$/, '');
  try {
    const { data } = await axios.post(
      `${base}/api/v1/predict-consultation`,
      { message, case_context: caseContext },
      {
        headers: { 'Content-Type': 'application/json', 'X-API-Key': env.ai.apiKey },
        timeout: 60000,
      }
    );
    const payload = data.data ?? data;
    return {
      answer: payload.answer ?? '',
      specialization: payload.detected_specialization ?? 'Tổng quát',
      suggestBooking: Boolean(payload.suggest_booking),
      source: payload.source,
      aiProvider: payload.ai_provider,
      model: payload.model,
      retrievalScore: payload.retrieval_score ?? 0,
      referenceTitle: payload.reference_title ?? null,
      citations: Array.isArray(payload.citations)
        ? payload.citations.map((citation) => ({
            docId: citation.doc_id,
            title: citation.title,
            fileName: citation.file_name,
            pages: Array.isArray(citation.pages) ? citation.pages : [],
            snippet: citation.snippet ?? null,
          }))
        : [],
    };
  } catch (error) {
    const detail = error.response?.data?.detail;
    const messageText = Array.isArray(detail)
      ? detail.map((item) => item.msg).join('; ')
      : detail || error.message || 'Không kết nối được Server-AI.';
    throw new ApiError(503, messageText);
  }
}
