from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.security import verify_api_key
from app.schemas.document import (
    DocumentCreate,
    DocumentDetail,
    DocumentListItem,
    DocumentUpdate,
)
from app.services import document_service
from app.services.document_loader import PdfExtractionError
from app.services.document_loader.implementation import MAX_PDF_SIZE_BYTES

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=list[DocumentListItem])
async def list_documents(_: bool = Depends(verify_api_key)):
    return document_service.list_documents()


@router.get("/{doc_id}", response_model=DocumentDetail)
async def get_document(doc_id: str, _: bool = Depends(verify_api_key)):
    try:
        return document_service.get_document(doc_id)
    except FileNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("", response_model=DocumentDetail, status_code=status.HTTP_201_CREATED)
async def create_document(
    body: DocumentCreate,
    _: bool = Depends(verify_api_key),
):
    try:
        return document_service.create_document(body.model_dump())
    except FileExistsError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.post("/upload", response_model=DocumentListItem, status_code=status.HTTP_201_CREATED)
async def upload_pdf_document(
    doc_id: str = Form(..., min_length=2, max_length=80),
    title: str = Form(..., min_length=2, max_length=255),
    specialization: str = Form(..., min_length=2, max_length=255),
    file: UploadFile = File(...),
    _: bool = Depends(verify_api_key),
):
    filename = file.filename or "document.pdf"
    if not filename.lower().endswith(".pdf") or file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file PDF hợp lệ.")

    content = await file.read(MAX_PDF_SIZE_BYTES + 1)
    await file.close()
    if len(content) > MAX_PDF_SIZE_BYTES:
        max_mb = MAX_PDF_SIZE_BYTES / (1024 * 1024)
        raise HTTPException(status_code=413, detail=f"File PDF vượt quá giới hạn {max_mb:g} MB.")

    try:
        return document_service.create_document(
            {
                "doc_id": doc_id,
                "title": title,
                "specialization": specialization,
                "content": content,
                "file_type": "pdf",
            }
        )
    except FileExistsError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except (PdfExtractionError, ValueError, FileNotFoundError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.put("/{doc_id}", response_model=DocumentDetail)
async def update_document(
    doc_id: str,
    body: DocumentUpdate,
    _: bool = Depends(verify_api_key),
):
    try:
        payload = body.model_dump(exclude_unset=True)
        if not payload:
            raise HTTPException(status_code=400, detail="Không có trường cần cập nhật")
        return document_service.update_document(doc_id, payload)
    except FileNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(doc_id: str, _: bool = Depends(verify_api_key)):
    try:
        document_service.delete_document(doc_id)
    except FileNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
