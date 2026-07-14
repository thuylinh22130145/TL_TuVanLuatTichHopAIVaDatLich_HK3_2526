'''FastAPI service for RAG-grounded legal consultation with Google Gemini.'''
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.services.gemini_service import is_gemini_configured

app = FastAPI(
    title='Law Firm AI Service',
    description='Tư vấn pháp lý sơ bộ bằng RAG và Google Gemini',
    version='0.2.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/health')
def health():
    from app.services.rag_retriever import retriever

    return {
        'status': 'ok',
        'service': 'server-ai',
        'documents_loaded': len(retriever.documents),
        'rag_threshold': settings.rag_similarity_threshold,
        'ai_provider': 'gemini' if is_gemini_configured() else 'fallback',
        'model': settings.gemini_model if is_gemini_configured() else None,
    }


app.include_router(api_router, prefix='/api/v1')


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('main:app', host='0.0.0.0', port=settings.port, reload=True)
