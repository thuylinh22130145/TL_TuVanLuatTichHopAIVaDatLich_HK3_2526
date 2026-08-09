import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ChatBubble from '../../components/ChatBubble';
import LawyerAvatar from '../../components/LawyerAvatar';
import { useAuth } from '../../context/AuthContext';
import {
  deleteChatSession,
  fetchChatSession,
  fetchChatSessions,
  getInitialChatMessages,
  sendChatMessage,
} from '../../services/chatService';
import './ChatPage.css';

function restoreMessages(session) {
  return [
    getInitialChatMessages()[0],
    ...(session.messages || []).map((item) => ({
      id: `msg-db-${item.id}`,
      role: item.role === 'USER' ? 'user' : 'assistant',
      content: item.content,
      timestamp: item.created_at,
      citations: item.citations || [],
    })),
  ];
}

export default function ChatPage() {
  const { authenticated, user } = useAuth();
  const [messages, setMessages] = useState(getInitialChatMessages);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!authenticated || user?.role !== 'USER') {
      setSessionId(null);
      return;
    }
    const storageKey = `legal-chat-session:${user.id}`;
    const savedId = Number(localStorage.getItem(storageKey));
    fetchChatSessions().then(setSessions).catch(() => setSessions([]));
    if (!Number.isSafeInteger(savedId) || savedId < 1) return;

    fetchChatSession(savedId)
      .then((session) => {
        setSessionId(savedId);
        setMessages(restoreMessages(session));
      })
      .catch(() => localStorage.removeItem(storageKey));
  }, [authenticated, user?.id, user?.role]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((current) => [...current, {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }]);
    setInput('');
    setSending(true);

    try {
      const reply = await sendChatMessage(text, messages, sessionId);
      if (reply.sessionId && authenticated && user?.role === 'USER') {
        setSessionId(reply.sessionId);
        localStorage.setItem(`legal-chat-session:${user.id}`, String(reply.sessionId));
        fetchChatSessions().then(setSessions).catch(() => {});
      }
      setMessages((current) => [...current, reply]);
    } catch (error) {
      setMessages((current) => [...current, {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: error.response?.data?.message || error.message || 'Không kết nối được máy chủ tư vấn.',
        timestamp: new Date().toISOString(),
        suggestBooking: false,
      }]);
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = () => {
    if (authenticated && user?.role === 'USER') {
      localStorage.removeItem(`legal-chat-session:${user.id}`);
    }
    setSessionId(null);
    setMessages(getInitialChatMessages());
    setInput('');
  };

  const openConversation = async (id) => {
    const nextId = Number(id);
    if (!nextId || nextId === sessionId) return;
    setSending(true);
    try {
      const session = await fetchChatSession(nextId);
      setSessionId(nextId);
      setMessages(restoreMessages(session));
      localStorage.setItem(`legal-chat-session:${user.id}`, String(nextId));
    } catch (requestError) {
      setMessages((current) => [...current, {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: requestError.response?.data?.message || 'Không mở được phiên tư vấn.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  };

  const removeConversation = async () => {
    if (!sessionId || !window.confirm('Xóa cuộc trò chuyện này?')) return;
    try {
      await deleteChatSession(sessionId);
      setSessions((current) => current.filter((item) => item.id !== sessionId));
      startNewConversation();
    } catch (requestError) {
      setMessages((current) => [...current, {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: requestError.response?.data?.message || 'Không xóa được phiên tư vấn.',
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  return (
    <div className='chat-page-shell'>
      <div className='chat-page-hero'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h1 className='chat-page-title'>Tư vấn pháp lý sơ bộ với AI</h1>
          {authenticated && user?.role === 'USER' && messages.length > 1 && (
            <button type='button' onClick={startNewConversation} className='btn-secondary'>
              Cuộc trò chuyện mới
            </button>
          )}
        </div>
        <p className='chat-page-subtitle'>
          Gemini phân tích câu hỏi dựa trên kho văn bản nội bộ và đề xuất luật sư theo lĩnh vực phù hợp.
        </p>
        {authenticated && user?.role === 'USER' && sessions.length > 0 && (
          <div className='mt-4 flex flex-wrap items-center gap-2'>
            <label className='text-sm text-law-slate' htmlFor='chat-session'>Lịch sử tư vấn</label>
            <select
              id='chat-session'
              className='input-field max-w-md'
              value={sessionId || ''}
              onChange={(event) => event.target.value
                ? openConversation(event.target.value)
                : startNewConversation()}
              disabled={sending}
            >
              <option value=''>Cuộc trò chuyện mới</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>{session.title || `Phiên #${session.id}`}</option>
              ))}
            </select>
            {sessionId && (
              <button type='button' onClick={removeConversation} className='text-sm font-semibold text-red-600'>
                Xóa phiên
              </button>
            )}
          </div>
        )}
      </div>

      <div className='chat-shell'>
        <div className='chat-messages'>
          {messages.map((message) => (
            <div key={message.id}>
              <ChatBubble message={message} />

              {message.role === 'assistant' && message.aiProvider && (
                <div className='mx-2 mt-2 text-xs text-law-slate'>
                  <div className='flex flex-wrap gap-2'>
                    <span className='rounded-full bg-law-navy/5 px-2 py-1'>
                      {message.needsMoreContext
                        ? 'Đang thu thập thông tin'
                        : message.aiProvider === 'gemini'
                          ? `Gemini · ${message.model || 'AI'}`
                          : 'Chế độ dự phòng'}
                    </span>
                  </div>

                  {message.citations?.length > 0 && (
                    <div className='chat-citations'>
                      <p className='chat-citations-title'>Nguồn tham khảo</p>
                      <ul>
                        {message.citations.map((citation) => (
                          <li key={`${citation.docId}-${citation.pages.join('-')}`}>
                            <span className='font-semibold text-law-navy'>{citation.title}</span>
                            {citation.fileName && <span> · {citation.fileName}</span>}
                            <span>
                              {' · '}
                              {citation.pages.length > 0
                                ? `Trang ${citation.pages.join(', ')}`
                                : 'Không có số trang (tài liệu text)'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {message.suggestedLawyers?.length > 0 && (
                <div className='chat-suggestion-card'>
                  <p className='font-medium text-law-navy'>
                    Luật sư phù hợp{message.specialization ? ` · ${message.specialization}` : ''}
                  </p>
                  <div className='mt-3 grid gap-3 sm:grid-cols-2'>
                    {message.suggestedLawyers.map((lawyer) => (
                      <article key={lawyer.id} className='rounded-xl border border-law-navy/10 bg-white p-3'>
                        <div className='flex items-center gap-3'>
                          <LawyerAvatar lawyer={lawyer} className='h-11 w-11 text-xs' />
                          <div>
                            <p className='font-semibold text-law-navy'>{lawyer.name}</p>
                            <p className='mt-1 text-sm text-law-slate'>{lawyer.specialty}</p>
                          </div>
                        </div>
                        <p className='mt-1 text-xs text-law-slate'>{lawyer.experience} năm kinh nghiệm</p>
                        <Link
                          to={`/luat-su?specialization=${encodeURIComponent(message.specialization || '')}&lawyer=${lawyer.id}`}
                          state={{ consultationSummary: message.consultationSummary || '' }}
                          className='mt-3 inline-block text-sm font-semibold text-law-gold hover:text-law-navy'
                        >
                          Xem hồ sơ và đặt lịch
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {message.suggestBooking && !message.suggestedLawyers?.length && (
                <div className='mx-2 mt-3 rounded-xl border border-law-gold/30 bg-law-gold/10 p-3 text-sm text-law-navy'>
                  Chưa có luật sư khớp chính xác trong hệ thống. Bạn có thể xem toàn bộ danh sách để đặt lịch.
                  <Link to='/luat-su' className='ml-2 font-semibold text-law-gold'>Xem luật sư</Link>
                </div>
              )}
            </div>
          ))}

          {sending && <p className='animate-pulse text-center text-xs text-law-slate'>Gemini đang phân tích...</p>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className='chat-compose'>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder='Mô tả vấn đề pháp lý của bạn...'
            className='chat-input'
            disabled={sending}
            maxLength={8000}
          />
          <button type='submit' disabled={sending || !input.trim()} className='chat-send'>Gửi</button>
        </form>
      </div>
    </div>
  );
}
