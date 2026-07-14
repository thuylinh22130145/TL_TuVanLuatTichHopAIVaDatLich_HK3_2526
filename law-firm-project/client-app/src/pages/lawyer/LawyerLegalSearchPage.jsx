import { useState } from 'react';
import { sendChatMessage } from '../../services/chatService';

export default function LawyerLegalSearchPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      setResult(await sendChatMessage(query.trim()));
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Không tra cứu được dữ liệu pháp luật.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='px-6 py-8 lg:px-10'>
      <p className='text-sm font-medium text-law-gold'>Kho dữ liệu RAG</p>
      <h1 className='mt-1 font-serif text-3xl font-bold text-law-navy'>Tra cứu pháp luật</h1>
      <p className='mt-2 max-w-3xl text-sm text-slate-500'>Tìm nội dung trong kho văn bản pháp luật và nhận bản phân tích sơ bộ từ AI Assistant.</p>

      <form onSubmit={search} className='mt-6 rounded-2xl bg-white p-6 shadow-sm'>
        <label className='text-sm font-semibold text-law-navy'>Nội dung cần tra cứu</label>
        <textarea value={query} onChange={(event) => setQuery(event.target.value)} rows={5} maxLength={8000} className='input-field mt-2 resize-y' placeholder='Ví dụ: Quy định về quyền nuôi con sau khi ly hôn...' />
        <button className='btn-primary mt-4' disabled={loading || !query.trim()}>{loading ? 'Đang tra cứu...' : 'Tra cứu'}</button>
      </form>

      {error && <p className='mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700'>{error}</p>}
      {result && (
        <section className='mt-6 rounded-2xl bg-white p-6 shadow-sm'>
          <div className='flex flex-wrap items-center gap-2 text-xs'>
            <span className='rounded-full bg-law-gold/10 px-3 py-1 font-semibold text-law-gold'>{result.specialization}</span>
            <span className='rounded-full bg-slate-100 px-3 py-1 text-slate-600'>{result.aiProvider === 'gemini' ? `Gemini · ${result.model}` : 'Fallback nội bộ'}</span>
            {result.referenceTitle && <span className='rounded-full bg-blue-50 px-3 py-1 text-blue-700'>Nguồn: {result.referenceTitle}</span>}
          </div>
          <div className='mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700'>{result.content}</div>
          <p className='mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500'>Kết quả dùng để hỗ trợ tra cứu, luật sư cần kiểm tra lại văn bản gốc và hiệu lực trước khi áp dụng.</p>
        </section>
      )}
    </div>
  );
}
