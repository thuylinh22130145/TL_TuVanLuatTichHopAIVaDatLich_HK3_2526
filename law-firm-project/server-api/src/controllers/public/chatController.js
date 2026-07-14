import * as chatService from '../../services/chatService.js';
import { ApiError } from '../../utils/ApiError.js';

export async function postChat(req, res) {
  const message = req.body.message?.trim();
  const caseContext = req.body.case_context?.trim() || null;
  if (!message) throw new ApiError(400, 'Nội dung tin nhắn không được để trống.');
  if (message.length > 8000) throw new ApiError(400, 'Nội dung tin nhắn vượt quá 8.000 ký tự.');

  const result = await chatService.processChatMessage(message, caseContext);
  res.json({ success: true, data: result });
}
