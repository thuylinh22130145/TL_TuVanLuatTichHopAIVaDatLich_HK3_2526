import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';

const { sequelize } = await import('../src/config/database.js');
const { ChatMessage, ChatSession, LegalCategory, User } = await import('../src/models/index.js');
const {
  deleteChatSession,
  getChatSession,
  processChatMessage,
} = await import('../src/services/chatService.js');

let firstUser;
let secondUser;

function aiResult(answer = 'Phản hồi có căn cứ.') {
  return {
    answer,
    needsMoreContext: false,
    specialization: 'Dân sự',
    suggestBooking: true,
    source: 'internal_rag',
    citations: [{ title: 'Bộ luật Dân sự' }],
  };
}

before(async () => {
  await sequelize.sync({ force: true });
  await LegalCategory.create({ name: 'Dân sự', slug: 'dan-su', status: 'ACTIVE' });
  firstUser = await User.create({
    username: 'chat.user.one',
    email: 'chat-one@example.com',
    password_hash: 'not-used',
    full_name: 'Chat User One',
    role: 'USER',
    status: 'ACTIVE',
  });
  secondUser = await User.create({
    username: 'chat.user.two',
    email: 'chat-two@example.com',
    password_hash: 'not-used',
    full_name: 'Chat User Two',
    role: 'USER',
    status: 'ACTIVE',
  });
});

after(async () => {
  await sequelize.close();
});

test('creates a session and persists both sides of a successful chat', async () => {
  const result = await processChatMessage('Tôi cần tư vấn hợp đồng', null, [], {
    userId: firstUser.id,
    consult: async () => aiResult(),
    lawyerFinder: async () => [],
  });

  assert.ok(result.sessionId);
  const session = await ChatSession.findByPk(result.sessionId);
  assert.equal(session.user_id, firstUser.id);
  assert.equal(session.title, 'Tôi cần tư vấn hợp đồng');
  assert.ok(session.detected_category_id);

  const messages = await ChatMessage.findAll({
    where: { session_id: result.sessionId },
    order: [['id', 'ASC']],
  });
  assert.deepEqual(messages.map((item) => item.role), ['USER', 'ASSISTANT']);
  assert.equal(messages[1].source_type, 'INTERNAL_RAG');
});

test('reuses trusted database history and rejects another users session', async () => {
  const first = await processChatMessage('Câu hỏi đầu', null, [], {
    userId: firstUser.id,
    consult: async () => aiResult('Câu trả lời đầu'),
    lawyerFinder: async () => [],
  });

  let receivedHistory = null;
  await processChatMessage('Câu hỏi tiếp', null, [{ role: 'user', content: 'Lịch sử giả' }], {
    userId: firstUser.id,
    sessionId: first.sessionId,
    consult: async (_message, _context, history) => {
      receivedHistory = history;
      return aiResult('Câu trả lời tiếp');
    },
    lawyerFinder: async () => [],
  });

  assert.deepEqual(receivedHistory.map((item) => item.content), [
    'Câu hỏi đầu',
    'Câu trả lời đầu',
  ]);
  await assert.rejects(
    getChatSession(secondUser.id, first.sessionId),
    (error) => error.statusCode === 404,
  );
});

test('deleting an owned session cascades to its messages', async () => {
  const result = await processChatMessage('Phiên cần xóa', null, [], {
    userId: secondUser.id,
    consult: async () => aiResult(),
    lawyerFinder: async () => [],
  });

  await deleteChatSession(secondUser.id, result.sessionId);
  assert.equal(await ChatSession.count({ where: { id: result.sessionId } }), 0);
  assert.equal(await ChatMessage.count({ where: { session_id: result.sessionId } }), 0);
});
