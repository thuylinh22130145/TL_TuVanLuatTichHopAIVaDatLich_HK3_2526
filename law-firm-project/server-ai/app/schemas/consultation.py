from typing import Literal
from pydantic import BaseModel, Field

SourceType = Literal['internal_rag', 'insufficient_context']
ProviderType = Literal['gemini', 'fallback']


class ConsultationRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000, description='Câu hỏi pháp lý của người dùng')
    case_context: str | None = Field(default=None, max_length=12000, description='Bối cảnh vụ việc tùy chọn')


class ConsultationResponse(BaseModel):
    answer: str
    source: SourceType
    ai_provider: ProviderType
    model: str | None = None
    detected_specialization: str
    suggest_booking: bool
    retrieval_score: float = 0.0
    reference_title: str | None = None
