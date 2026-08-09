import * as chatService from '../../services/chatService.js';

export async function list(req, res) {
  const sessions = await chatService.listChatSessions(req.user.id);
  res.json({
    success: true,
    data: sessions.map((session) => session.toJSON()),
  });
}

export async function getOne(req, res) {
  const session = await chatService.getChatSession(req.user.id, req.params.id);
  res.json({ success: true, data: session.toJSON() });
}

export async function remove(req, res) {
  await chatService.deleteChatSession(req.user.id, req.params.id);
  res.json({ success: true, message: 'Đã xóa phiên tư vấn.' });
}
