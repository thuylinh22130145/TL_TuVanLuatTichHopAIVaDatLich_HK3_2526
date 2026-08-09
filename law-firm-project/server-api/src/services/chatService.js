import { Op } from 'sequelize';

import { sequelize } from '../config/database.js';
import { ChatMessage, ChatSession, LegalCategory } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { consultWithAI } from './aiService.js';
import { findLawyersBySpecialization } from './lawyerService.js';

const CHAT_HISTORY_LIMIT = 12;

function normalize(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function toConversationHistory(messages) {
  return messages.map((item) => ({
    role: item.role === 'USER' ? 'user' : 'assistant',
    content: item.content,
  }));
}

async function getOwnedSession(sessionId, userId) {
  if (!sessionId) return null;
  const session = await ChatSession.findOne({ where: { id: sessionId, user_id: userId } });
  if (!session) throw new ApiError(404, 'Không tìm thấy phiên tư vấn của bạn.');
  return session;
}

async function loadSessionHistory(sessionId) {
  if (!sessionId) return [];
  const messages = await ChatMessage.findAll({
    where: { session_id: sessionId, role: { [Op.in]: ['USER', 'ASSISTANT'] } },
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    limit: CHAT_HISTORY_LIMIT,
  });
  return toConversationHistory(messages.reverse());
}

async function findCategoryId(specialization, transaction) {
  const target = normalize(specialization);
  if (!target || target === normalize('Tổng quát')) return null;
  const categories = await LegalCategory.findAll({
    where: { status: 'ACTIVE' },
    attributes: ['id', 'name'],
    transaction,
  });
  return categories.find((category) => {
    const name = normalize(category.name);
    return name.includes(target) || target.includes(name);
  })?.id ?? null;
}

function sourceType(source) {
  return source === 'internal_rag' ? 'INTERNAL_RAG' : 'NONE';
}

export async function processChatMessage(
  message,
  caseContext = null,
  conversationHistory = [],
  {
    userId = null,
    sessionId = null,
    consult = consultWithAI,
    lawyerFinder = findLawyersBySpecialization,
  } = {},
) {
  const session = userId ? await getOwnedSession(sessionId, userId) : null;
  const trustedHistory = session
    ? await loadSessionHistory(session.id)
    : conversationHistory;
  const aiResult = await consult(message, caseContext, trustedHistory);
  const suggestedLawyers = aiResult.needsMoreContext
    ? []
    : await lawyerFinder(aiResult.specialization, 3);

  let persistedSession = session;
  if (userId) {
    persistedSession = await sequelize.transaction(async (transaction) => {
      const currentSession = session || await ChatSession.create({
        user_id: userId,
        title: message.trim().replace(/\s+/g, ' ').slice(0, 120),
      }, { transaction });
      const categoryId = await findCategoryId(aiResult.specialization, transaction);
      await ChatMessage.bulkCreate([
        {
          session_id: currentSession.id,
          role: 'USER',
          content: message,
          source_type: 'NONE',
        },
        {
          session_id: currentSession.id,
          role: 'ASSISTANT',
          content: aiResult.answer,
          source_type: sourceType(aiResult.source),
          citations: aiResult.citations || null,
        },
      ], { transaction });
      await currentSession.update({
        detected_category_id: categoryId,
        updated_at: new Date(),
      }, { transaction });
      return currentSession;
    });
  }

  return {
    ...aiResult,
    sessionId: persistedSession?.id ?? null,
    suggestedLawyers: suggestedLawyers.map((lawyer) => lawyer.toJSON()),
  };
}

export async function listChatSessions(userId) {
  return ChatSession.findAll({
    where: { user_id: userId },
    attributes: ['id', 'title', 'detected_category_id', 'created_at', 'updated_at'],
    include: [{
      model: LegalCategory,
      as: 'detectedCategory',
      attributes: ['id', 'name', 'slug'],
      required: false,
    }],
    order: [['updated_at', 'DESC']],
  });
}

export async function getChatSession(userId, sessionId) {
  const session = await ChatSession.findOne({
    where: { id: sessionId, user_id: userId },
    include: [
      {
        model: LegalCategory,
        as: 'detectedCategory',
        attributes: ['id', 'name', 'slug'],
        required: false,
      },
      {
        model: ChatMessage,
        as: 'messages',
        attributes: ['id', 'role', 'content', 'source_type', 'citations', 'created_at'],
      },
    ],
    order: [[{ model: ChatMessage, as: 'messages' }, 'created_at', 'ASC']],
  });
  if (!session) throw new ApiError(404, 'Không tìm thấy phiên tư vấn của bạn.');
  return session;
}

export async function deleteChatSession(userId, sessionId) {
  const session = await getOwnedSession(sessionId, userId);
  await session.destroy();
  return true;
}
