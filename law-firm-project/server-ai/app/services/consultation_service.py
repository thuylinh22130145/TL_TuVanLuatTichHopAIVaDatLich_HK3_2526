'''RAG retrieval, Gemini generation, domain classification and safe fallback.'''
import asyncio

import logging
import re
from app.core.config import settings
from app.schemas.consultation import ConsultationResponse, SourceType
from app.services.gemini_service import (
    GeminiUnavailableError,
    generate_grounded_answer,
    is_gemini_configured,
)
from app.services.context_guard import assess_context
from app.services.mock_llm import generate_answer as generate_fallback_answer
from app.services.rag_retriever import retriever
from app.services.specialization import detect_specialization


logger = logging.getLogger(__name__)


def _sanitize_page_citations(answer: str, allowed_pages: list[int]) -> str:
    allowed = set(allowed_pages)

    def replace(match: re.Match) -> str:
        return match.group(0) if int(match.group(1)) in allowed else ''

    return re.sub(r'\s*\[Trang\s+(\d+)\]', replace, answer, flags=re.IGNORECASE)


def _history_text(conversation_history: list[dict] | None) -> str:
    lines = []
    for item in (conversation_history or [])[-8:]:
        role = 'Người dùng' if item.get('role') == 'user' else 'Chatbot'
        content = str(item.get('content') or '').strip()
        if content:
            limit = 2000 if item.get('role') == 'user' else 800
            lines.append(f'{role}: {content[:limit]}')
    return '\n'.join(lines)[-6000:]


async def predict_consultation(
    message: str,
    case_context: str | None = None,
    conversation_history: list[dict] | None = None,
) -> ConsultationResponse:
    assessment = assess_context(message, conversation_history)
    if assessment.needs_more_context:
        return ConsultationResponse(
            answer=assessment.answer or '',
            needs_more_context=True,
            source='insufficient_context',
            ai_provider='fallback',
            model=None,
            detected_specialization=assessment.specialization,
            suggest_booking=False,
            retrieval_score=0.0,
            reference_title=None,
            citations=[],
            retrieval_backend='none',
            embedding_model=None,
            matched_chunk_count=0,
        )

    query = message.strip()
    history = _history_text(conversation_history)
    user_history = '\n'.join(
        str(item.get('content') or '').strip()
        for item in (conversation_history or [])[-8:]
        if item.get('role') == 'user'
    )
    if user_history:
        query = f'{user_history}\n{query}'[-12000:]
    if case_context:
        query = f'{query}\nBối cảnh vụ việc: {case_context.strip()}'

    question_specialization = detect_specialization(query)
    retrieval_query = query
    if question_specialization != 'Tổng quát':
        retrieval_query = f'{query}\nLĩnh vực pháp luật: {question_specialization}'

    # Keep the FastAPI event loop responsive while parsing and searching.
    retrieval = await asyncio.to_thread(
        retriever.retrieve,
        retrieval_query,
        question_specialization,
    )
    source: SourceType
    reference_title: str | None = None
    document_specialization: str | None = None
    citations: list[dict] = []

    if retrieval.is_high_confidence and retrieval.document:
        source = 'internal_rag'
        document = retrieval.document
        reference_title = document.title
        document_specialization = document.specialization
        chunks = retrieval.matched_chunks or [document.content[:3000]]
        context = f'Tài liệu: {document.title}\n\n' + '\n\n'.join(chunks)
        snippet = ' '.join(chunks[0].split())[:320] if chunks else None
        citations = [
            {
                'doc_id': document.doc_id,
                'title': document.title,
                'file_name': document.file_path.name,
                'pages': retrieval.citation_pages,
                'snippet': snippet,
            }
        ]
    else:
        source = 'insufficient_context'
        context = (
            'Kho dữ liệu nội bộ chưa tìm thấy văn bản đủ tương đồng với câu hỏi. '
            'Không được tự tạo căn cứ pháp luật; hãy yêu cầu người dùng bổ sung thông tin '
            'và khuyến nghị trao đổi với luật sư.'
        )

    specialization = question_specialization
    if specialization == 'Tổng quát':
        specialization = detect_specialization(
            question=message,
            fallback_from_doc=document_specialization,
        )

    provider = 'fallback'
    model = None
    try:
        if not is_gemini_configured():
            raise GeminiUnavailableError('GEMINI_API_KEY chưa được cấu hình.')
        answer = await asyncio.to_thread(
            generate_grounded_answer,
            message,
            context,
            source,
            case_context,
            history,
        )
        provider = 'gemini'
        model = settings.gemini_model
    except GeminiUnavailableError as exc:
        logger.warning('Gemini không khả dụng; chuyển sang fallback cục bộ: %s', exc)
        answer = generate_fallback_answer(
            question=message,
            context=context,
            source_label=source,
            doc_specialization=specialization,
        )

    answer = _sanitize_page_citations(answer, retrieval.citation_pages)

    return ConsultationResponse(
        answer=answer,
        needs_more_context=False,
        source=source,
        ai_provider=provider,
        model=model,
        detected_specialization=specialization,
        suggest_booking=source == 'insufficient_context' or specialization != 'Tổng quát',
        retrieval_score=retrieval.score,
        reference_title=reference_title,
        citations=citations,
        retrieval_backend=retrieval.backend,
        embedding_model=retrieval.embedding_model,
        matched_chunk_count=len(retrieval.matched_chunks),
    )
