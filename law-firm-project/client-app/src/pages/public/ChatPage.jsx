import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ChatBubble from '../../components/ChatBubble';
import { getInitialChatMessages, sendChatMessage } from '../../services/chatService';
import './ChatPage.css';

export default function ChatPage() {
  const [messages, setMessages] = useState(getInitialChatMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

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
      const reply = await sendChatMessage(text);
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

  return (
    <div className='chat-page-shell'>
      <div className='chat-page-hero'>
        <h1 className='chat-page-title'>Tư vấn pháp lý sơ bộ với AI</h1>
        <p className='chat-page-subtitle'>
          Gemini phân tích câu hỏi dựa trên kho văn bản nội bộ và đề xuất luật sư theo lĩnh vực phù hợp.
        </p>
      </div>

      <div className='chat-shell'>
        <div className='chat-messages'>
          {messages.map((message) => (
            <div key={message.id}>
              <ChatBubble message={message} />

              {message.role === 'assistant' && message.aiProvider && (
                <div className='mx-2 mt-2 flex flex-wrap gap-2 text-xs text-law-slate'>
                  <span className='rounded-full bg-law-navy/5 px-2 py-1'>
                    {message.aiProvider === 'gemini' ? `Gemini · ${message.model || 'AI'}` : 'Chế độ fallback'}
                  </span>
                  {message.referenceTitle && (
                    <span className='rounded-full bg-law-gold/10 px-2 py-1'>Nguồn: {message.referenceTitle}</span>
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
                        <p className='font-semibold text-law-navy'>{lawyer.name}</p>
                        <p className='mt-1 text-sm text-law-slate'>{lawyer.specialty}</p>
                        <p className='mt-1 text-xs text-law-slate'>{lawyer.experience} năm kinh nghiệm</p>
                        <Link
                          to={`/luat-su?specialization=${encodeURIComponent(message.specialization || '')}&lawyer=${lawyer.id}`}
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
