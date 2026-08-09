import * as chatService from '../../services/chatService.js';
import { ApiError } from '../../utils/ApiError.js';

export async function postChat(req, res) {
  const message = req.body.message?.trim();
  const caseContext = req.body.case_context?.trim() || null;
  const sessionId = req.body.session_id == null ? null : Number(req.body.session_id);
  const conversationHistory = Array.isArray(req.body.conversation_history)
    ? req.body.conversation_history
      .slice(-12)
      .filter((item) => ['user', 'assistant'].includes(item?.role) && typeof item?.content === 'string')
      .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 8000) }))
      .filter((item) => item.content)
    : [];
  if (!message) throw new ApiError(400, 'Nội dung tin nhắn không được để trống.');
  if (message.length > 8000) throw new ApiError(400, 'Nội dung tin nhắn vượt quá 8.000 ký tự.');
  if (sessionId !== null && (!Number.isSafeInteger(sessionId) || sessionId < 1)) {
    throw new ApiError(400, 'Mã phiên tư vấn không hợp lệ.');
  }

  const result = await chatService.processChatMessage(
    message,
    caseContext,
    conversationHistory,
    {
      userId: req.user?.role === 'USER' ? req.user.id : null,
      sessionId,
    },
  );
  res.json({ success: true, data: result });
}
