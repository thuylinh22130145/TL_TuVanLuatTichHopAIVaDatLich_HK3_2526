from fastapi import APIRouter
from app.api.v1.routes import consultation, documents

api_router = APIRouter()
api_router.include_router(consultation.router)
api_router.include_router(documents.router)
