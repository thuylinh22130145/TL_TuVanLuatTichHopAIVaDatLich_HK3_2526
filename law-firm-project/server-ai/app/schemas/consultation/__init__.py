"""Consultation schemas with transparent retrieval metadata."""

from typing import Literal

from pydantic import BaseModel, Field

from app.services.rag_retriever import get_retrieval_metadata


SourceType = Literal["internal_rag", "insufficient_context"]
ProviderType = Literal["gemini", "fallback"]
RetrievalBackendType = Literal[
    "gemini_vector",
    "keyword_fallback",
    "none",
]


def _metadata_value(name: str, default):
    return get_retrieval_metadata().get(name, default)


class ConsultationRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=8000,
        description="Câu hỏi pháp lý của người dùng",
    )
    case_context: str | None = Field(
        default=None,
        max_length=12000,
        description="Bối cảnh vụ việc tùy chọn",
    )


class Citation(BaseModel):
    doc_id: str
    title: str
    file_name: str
    pages: list[int] = Field(default_factory=list)
    snippet: str | None = None


class ConsultationResponse(BaseModel):
    answer: str
    source: SourceType
    ai_provider: ProviderType
    model: str | None = None
    detected_specialization: str
    suggest_booking: bool
    retrieval_score: float = 0.0
    reference_title: str | None = None
    citations: list[Citation] = Field(default_factory=list)
    retrieval_backend: RetrievalBackendType = Field(
        default_factory=lambda: _metadata_value("backend", "none")
    )
    embedding_model: str | None = Field(
        default_factory=lambda: _metadata_value("embedding_model", None)
    )
    matched_chunk_count: int = Field(
        default_factory=lambda: _metadata_value("matched_chunk_count", 0)
    )
