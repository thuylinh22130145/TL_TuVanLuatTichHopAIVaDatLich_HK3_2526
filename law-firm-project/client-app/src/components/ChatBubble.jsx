export default function ChatBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-[20px] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
          isUser
            ? 'rounded-br-md bg-law-navy text-white'
            : 'rounded-bl-md border border-law-navy/10 bg-white text-law-navy'
        }`}
      >
        {!isUser && (
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-law-gold">
            Trợ lý AI
          </span>
        )}
        <div className="break-words">{message.content}</div>
      </div>
    </div>
  );
}
