import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { searchLegalKnowledge } from '../../services/lawyerPortalService';
import './LawyerLegalSearchPage.css';

const SUGGESTED_QUERIES = [
  'Quy định về quyền nuôi con sau khi ly hôn',
  'Điều kiện chuyển nhượng quyền sử dụng đất',
  'Trách nhiệm khi đơn phương chấm dứt hợp đồng',
];

function getErrorMessage(error) {
  return error.response?.data?.message
    || error.response?.data?.detail
    || error.message
    || 'Không thể tra cứu dữ liệu pháp luật. Vui lòng thử lại.';
}

export default function LawyerLegalSearchPage() {
  const [query, setQuery] = useState('');
  const [caseContext, setCaseContext] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const search = async (event) => {
    event?.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery || loading) return;

    setLoading(true);
    setError('');
    setCopied(false);
    try {
      setResult(await searchLegalKnowledge(normalizedQuery, caseContext.trim()));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const useSuggestion = (suggestion) => {
    setQuery(suggestion);
    setError('');
  };

  const copyAnswer = async () => {
    if (!result?.answer) return;
    try {
      await navigator.clipboard.writeText(result.answer);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const matchPercentage = Math.round(Math.max(0, Math.min(1, Number(result?.retrievalScore) || 0)) * 100);

  return (
    <div className='legal-search-page'>
      <header className='legal-search-header'>
        <div>
          <p className='legal-search-eyebrow'>Kho dữ liệu pháp luật RAG</p>
          <h1>Tra cứu pháp luật</h1>
          <p className='legal-search-subtitle'>
            Tìm kiếm trong kho văn bản nội bộ và nhận phân tích có dẫn nguồn từ Chatbot AI.
          </p>
        </div>
        <div className='legal-search-status' aria-label='Trạng thái kho dữ liệu'>
          <span aria-hidden='true' /> Kho dữ liệu sẵn sàng
        </div>
      </header>

      <form onSubmit={search} className='legal-search-form'>
        <div className='legal-search-label-row'>
          <label htmlFor='legal-query'>Nội dung cần tra cứu</label>
          <span>{query.length}/8.000</span>
        </div>
        <textarea
          id='legal-query'
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          rows={5}
          maxLength={8000}
          disabled={loading}
          placeholder='Ví dụ: Quy định về quyền nuôi con sau khi ly hôn...'
        />

        <div className='legal-search-suggestions' aria-label='Gợi ý tra cứu'>
          {SUGGESTED_QUERIES.map((suggestion) => (
            <button key={suggestion} type='button' onClick={() => useSuggestion(suggestion)} disabled={loading}>
              {suggestion}
            </button>
          ))}
        </div>

        <button
          type='button'
          className='legal-search-context-toggle'
          onClick={() => setShowContext((current) => !current)}
          aria-expanded={showContext}
        >
          {showContext ? '− Ẩn bối cảnh vụ việc' : '+ Thêm bối cảnh vụ việc (không bắt buộc)'}
        </button>

        {showContext && (
          <textarea
            className='legal-search-context'
            value={caseContext}
            onChange={(event) => setCaseContext(event.target.value)}
            rows={3}
            maxLength={12000}
            disabled={loading}
            placeholder='Bổ sung tình tiết, thời điểm hoặc tài liệu liên quan để kết quả sát hơn...'
          />
        )}

        <div className='legal-search-actions'>
          <p>Chatbot chỉ sử dụng tài liệu tìm thấy trong kho dữ liệu làm căn cứ trả lời.</p>
          <button type='submit' disabled={loading || !query.trim()}>
            {loading && <span className='legal-search-spinner' aria-hidden='true' />}
            {loading ? 'Đang tra cứu...' : 'Tra cứu'}
          </button>
        </div>
      </form>

      {error && (
        <div className='legal-search-error' role='alert'>
          <strong>Tra cứu chưa thành công.</strong> {error}
        </div>
      )}

      {loading && (
        <section className='legal-search-loading' aria-live='polite'>
          <span className='legal-search-spinner' aria-hidden='true' />
          <div>
            <strong>Đang đối chiếu kho văn bản...</strong>
            <p>Hệ thống đang tìm nguồn phù hợp và tạo bản phân tích.</p>
          </div>
        </section>
      )}

      {result && !loading && (
        <section className='legal-search-result' aria-live='polite'>
          <div className='legal-search-result-head'>
            <div>
              <p className='legal-search-result-kicker'>Kết quả phân tích</p>
              <h2>{result.referenceTitle || 'Phân tích từ kho dữ liệu pháp luật'}</h2>
            </div>
            <button type='button' className='legal-search-copy' onClick={copyAnswer}>
              {copied ? 'Đã sao chép' : 'Sao chép kết quả'}
            </button>
          </div>

          <div className='legal-search-badges'>
            <span>{result.specialization || 'Tổng quát'}</span>
            <span>{result.aiProvider === 'gemini' ? `Gemini · ${result.model || 'AI'}` : 'Chế độ dự phòng'}</span>
            <span className={result.source === 'internal_rag' ? 'is-success' : 'is-warning'}>
              {result.source === 'internal_rag' ? `Độ khớp ${matchPercentage}%` : 'Chưa đủ căn cứ trong kho'}
            </span>
          </div>

          <div className='legal-search-answer chat-markdown'>
            <ReactMarkdown>{result.answer || 'Không có nội dung trả lời.'}</ReactMarkdown>
          </div>

          <div className='legal-search-sources'>
            <h3>Nguồn tham khảo</h3>
            {result.citations?.length > 0 ? (
              <div className='legal-search-source-list'>
                {result.citations.map((citation) => (
                  <article key={`${citation.docId}-${(citation.pages || []).join('-')}`}>
                    <div className='legal-search-source-icon' aria-hidden='true'>§</div>
                    <div>
                      <strong>{citation.title}</strong>
                      <p>
                        {citation.fileName || 'Văn bản nội bộ'}
                        {' · '}
                        {citation.pages?.length ? `Trang ${citation.pages.join(', ')}` : 'Tài liệu không phân trang'}
                      </p>
                      {citation.snippet && <blockquote>{citation.snippet}</blockquote>}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className='legal-search-no-source'>Chưa tìm thấy văn bản đủ tương đồng để trích dẫn.</p>
            )}
          </div>

          <p className='legal-search-disclaimer'>
            Kết quả dùng để hỗ trợ tra cứu. Luật sư cần kiểm tra văn bản gốc, hiệu lực và tình tiết thực tế trước khi áp dụng.
          </p>
        </section>
      )}
    </div>
  );
}
