from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import verify_api_key
from app.schemas.document import (
    DocumentCreate,
    DocumentDetail,
    DocumentListItem,
    DocumentUpdate,
)
from app.services import document_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=list[DocumentListItem])
async def list_documents(_: bool = Depends(verify_api_key)):
    return document_service.list_documents()


@router.get("/{doc_id}", response_model=DocumentDetail)
async def get_document(doc_id: str, _: bool = Depends(verify_api_key)):
    try:
        return document_service.get_document(doc_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("", response_model=DocumentDetail, status_code=status.HTTP_201_CREATED)
async def create_document(
    body: DocumentCreate,
    _: bool = Depends(verify_api_key),
):
    try:
        return document_service.create_document(body.model_dump())
    except FileExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


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
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(doc_id: str, _: bool = Depends(verify_api_key)):
    try:
        document_service.delete_document(doc_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
