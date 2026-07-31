'''RAG retrieval, Gemini generation, domain classification and safe fallback.'''
import asyncio

import logging
from app.core.config import settings
from app.schemas.consultation import ConsultationResponse, SourceType
from app.services.gemini_service import (
    GeminiUnavailableError,
    generate_grounded_answer,
    is_gemini_configured,
)
from app.services.mock_llm import generate_answer as generate_fallback_answer
from app.services.rag_retriever import retriever
from app.services.specialization import detect_specialization


logger = logging.getLogger(__name__)


async def predict_consultation(message: str, case_context: str | None = None) -> ConsultationResponse:
    query = message.strip()
    if case_context:
        query = f'{query}\nBối cảnh vụ việc: {case_context.strip()}'

    retrieval = retriever.retrieve(query)
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

    return ConsultationResponse(
        answer=answer,
        source=source,
        ai_provider=provider,
        model=model,
        detected_specialization=specialization,
        suggest_booking=source == 'insufficient_context' or specialization != 'Tổng quát',
        retrieval_score=retrieval.score,
        reference_title=reference_title,
        citations=citations,
    )
