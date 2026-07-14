from fastapi import APIRouter, Depends

from app.core.security import verify_api_key
from app.schemas.consultation import ConsultationRequest, ConsultationResponse
from app.services.consultation_service import predict_consultation

router = APIRouter(tags=['consultation'])


@router.post('/predict-consultation', response_model=ConsultationResponse, summary='Tư vấn pháp lý bằng RAG và Gemini')
async def post_predict_consultation(
    body: ConsultationRequest,
    _: bool = Depends(verify_api_key),
) -> ConsultationResponse:
    return await predict_consultation(body.message, body.case_context)


@router.post('/consult', response_model=ConsultationResponse, summary='Alias tương thích server-api')
async def post_consult_alias(
    body: ConsultationRequest,
    _: bool = Depends(verify_api_key),
) -> ConsultationResponse:
    return await predict_consultation(body.message, body.case_context)
