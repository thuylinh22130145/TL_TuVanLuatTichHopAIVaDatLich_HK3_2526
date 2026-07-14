"""
CRUD tài liệu luật cục bộ trong app/data — sau mỗi thay đổi reload RAG.
"""
import json
import re
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings
from app.services.document_loader import load_documents_from_directory
from app.services.rag_retriever import retriever

ALLOWED_TYPES = {"txt", "pdf"}
META_SUFFIX = ".meta.json"


def _safe_doc_id(doc_id: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_-]", "", doc_id.strip().replace(" ", "_"))
    if not cleaned or len(cleaned) < 2:
        raise ValueError("doc_id không hợp lệ (chỉ a-z, 0-9, _, -)")
    return cleaned[:80]


def _meta_path(data_dir: Path, doc_id: str) -> Path:
    return data_dir / f"{doc_id}{META_SUFFIX}"


def _file_path(data_dir: Path, doc_id: str, file_type: str) -> Path:
    return data_dir / f"{doc_id}.{file_type}"


def _write_meta(path: Path, title: str, specialization: str) -> None:
    payload = {
        "title": title,
        "specialization": specialization,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def _read_meta_for_stem(data_dir: Path, stem: str) -> dict:
    meta_path = _meta_path(data_dir, stem)
    if not meta_path.exists():
        return {}
    try:
        return json.loads(meta_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def _reload_rag() -> None:
    retriever.reload()


def _doc_to_list_item(doc) -> dict:
    stat = doc.file_path.stat()
    return {
        "doc_id": doc.doc_id,
        "title": doc.title,
        "specialization": doc.specialization,
        "file_name": doc.file_path.name,
        "file_type": doc.file_path.suffix.lstrip(".").lower(),
        "size_bytes": stat.st_size,
        "updated_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
    }


def list_documents() -> list[dict]:
    data_dir = settings.data_path
    data_dir.mkdir(parents=True, exist_ok=True)
    docs = load_documents_from_directory(data_dir)
    return [_doc_to_list_item(d) for d in docs]


def get_document(doc_id: str) -> dict:
    data_dir = settings.data_path
    safe_id = _safe_doc_id(doc_id)
    docs = load_documents_from_directory(data_dir)
    match = next((d for d in docs if d.doc_id == safe_id), None)
    if not match:
        raise FileNotFoundError(f"Không tìm thấy tài liệu: {safe_id}")

    item = _doc_to_list_item(match)
    item["content"] = match.content
    return item


def create_document(payload: dict) -> dict:
    data_dir = settings.data_path
    data_dir.mkdir(parents=True, exist_ok=True)

    safe_id = _safe_doc_id(payload["doc_id"])
    file_type = payload.get("file_type", "txt").lower()
    if file_type not in ALLOWED_TYPES:
        raise ValueError("file_type chỉ hỗ trợ txt hoặc pdf")

    target = _file_path(data_dir, safe_id, file_type)
    if target.exists():
        raise FileExistsError(f"Tài liệu {safe_id} đã tồn tại")

    content = payload["content"]
    if file_type == "txt":
        target.write_text(content, encoding="utf-8")
    else:
        target.write_bytes(content.encode("utf-8") if isinstance(content, str) else content)

    _write_meta(_meta_path(data_dir, safe_id), payload["title"], payload["specialization"])
    _reload_rag()
    return get_document(safe_id)


def update_document(doc_id: str, payload: dict) -> dict:
    data_dir = settings.data_path
    safe_id = _safe_doc_id(doc_id)

    existing = None
    for ext in ALLOWED_TYPES:
        p = _file_path(data_dir, safe_id, ext)
        if p.exists():
            existing = p
            break

    if not existing:
        raise FileNotFoundError(f"Không tìm thấy tài liệu: {safe_id}")

    meta_path = _meta_path(data_dir, safe_id)
    meta = _read_meta_for_stem(data_dir, safe_id)

    if payload.get("content") is not None:
        if existing.suffix.lower() == ".txt":
            existing.write_text(payload["content"], encoding="utf-8")
        else:
            existing.write_text(payload["content"], encoding="utf-8")

    title = payload.get("title") or meta.get("title") or safe_id
    specialization = payload.get("specialization") or meta.get("specialization") or "Tổng quát"
    _write_meta(meta_path, title, specialization)

    _reload_rag()
    return get_document(safe_id)


def delete_document(doc_id: str) -> bool:
    data_dir = settings.data_path
    safe_id = _safe_doc_id(doc_id)
    deleted = False

    for ext in ALLOWED_TYPES:
        p = _file_path(data_dir, safe_id, ext)
        if p.exists():
            p.unlink()
            deleted = True

    meta_path = _meta_path(data_dir, safe_id)
    if meta_path.exists():
        meta_path.unlink()
        deleted = True

    if not deleted:
        raise FileNotFoundError(f"Không tìm thấy tài liệu: {safe_id}")

    _reload_rag()
    return True
