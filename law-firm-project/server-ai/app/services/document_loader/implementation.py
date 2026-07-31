"""Load legal TXT and PDF documents with real PDF text extraction.

This package supersedes the legacy ``document_loader.py`` module while keeping
the same public API used by the document service and RAG retriever.
"""

from __future__ import annotations

import json
import logging
import os
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path


logger = logging.getLogger(__name__)

MAX_PDF_SIZE_BYTES = int(
    float(os.getenv("PDF_MAX_SIZE_MB", "25")) * 1024 * 1024
)
MAX_PDF_PAGES = max(1, int(os.getenv("PDF_MAX_PAGES", "500")))
MAX_EXTRACTED_CHARACTERS = max(
    10_000,
    int(os.getenv("PDF_MAX_EXTRACTED_CHARACTERS", "2000000")),
)
PDF_STRICT_MODE = os.getenv("PDF_STRICT_MODE", "false").lower() in {
    "1",
    "true",
    "yes",
}


class DocumentLoadError(ValueError):
    """Base error raised when a legal document cannot be loaded safely."""


class PdfExtractionError(DocumentLoadError):
    """Raised when a PDF is invalid, encrypted or contains no extractable text."""


@dataclass
class LawDocument:
    doc_id: str
    title: str
    specialization: str
    file_path: Path
    content: str


def _read_txt(path: Path) -> str:
    content = path.read_text(encoding="utf-8", errors="replace")
    return _normalize_extracted_text(content)


def _read_meta(path: Path) -> dict:
    meta_path = path.parent / f"{path.stem}.meta.json"
    if not meta_path.exists():
        return {}
    try:
        payload = json.loads(meta_path.read_text(encoding="utf-8"))
        return payload if isinstance(payload, dict) else {}
    except (json.JSONDecodeError, OSError):
        logger.warning("Không đọc được metadata của %s.", path.name)
        return {}


def _normalize_extracted_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text or "")
    text = text.replace("\x00", "").replace("\r\n", "\n").replace("\r", "\n")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]

    normalized_lines: list[str] = []
    previous_blank = False
    for line in lines:
        is_blank = not line
        if is_blank and previous_blank:
            continue
        normalized_lines.append(line)
        previous_blank = is_blank
    return "\n".join(normalized_lines).strip()


def _validate_pdf_file(path: Path) -> None:
    try:
        size = path.stat().st_size
    except OSError as error:
        raise PdfExtractionError(f"Không đọc được file PDF {path.name}.") from error

    if size == 0:
        raise PdfExtractionError(f"PDF {path.name} là file rỗng.")
    if size > MAX_PDF_SIZE_BYTES:
        max_size_mb = MAX_PDF_SIZE_BYTES / (1024 * 1024)
        raise PdfExtractionError(
            f"PDF {path.name} vượt quá giới hạn {max_size_mb:g} MB."
        )
    try:
        with path.open("rb") as pdf_file:
            if pdf_file.read(5) != b"%PDF-":
                raise PdfExtractionError(
                    f"{path.name} không có header PDF hợp lệ."
                )
    except OSError as error:
        raise PdfExtractionError(f"Không đọc được file PDF {path.name}.") from error


def _extract_page_text(page) -> str:
    try:
        # Layout mode keeps columns and headings more stable on legal documents.
        text = page.extract_text(extraction_mode="layout")
    except TypeError:
        # Compatibility with older pypdf versions.
        text = page.extract_text()
    except Exception as error:
        raise PdfExtractionError(
            "Không thể trích xuất nội dung của một trang PDF."
        ) from error
    return _normalize_extracted_text(text or "")


def _read_pdf(path: Path) -> str:
    _validate_pdf_file(path)

    try:
        from pypdf import PdfReader
        from pypdf.errors import PdfReadError
    except ImportError as error:
        raise PdfExtractionError(
            "Chưa cài pypdf. Hãy chạy pip install -r requirements-pdf.txt."
        ) from error

    try:
        reader = PdfReader(str(path), strict=False)
    except (PdfReadError, OSError, ValueError) as error:
        raise PdfExtractionError(f"PDF {path.name} bị lỗi hoặc không hợp lệ.") from error

    if reader.is_encrypted:
        try:
            decrypt_result = reader.decrypt("")
        except Exception as error:
            raise PdfExtractionError(
                f"PDF {path.name} được bảo vệ bằng mật khẩu."
            ) from error
        if decrypt_result == 0:
            raise PdfExtractionError(
                f"PDF {path.name} được bảo vệ bằng mật khẩu."
            )

    page_count = len(reader.pages)
    if page_count == 0:
        raise PdfExtractionError(f"PDF {path.name} không có trang.")
    if page_count > MAX_PDF_PAGES:
        raise PdfExtractionError(
            f"PDF {path.name} có {page_count} trang, vượt giới hạn "
            f"{MAX_PDF_PAGES} trang."
        )

    page_sections: list[str] = []
    extracted_characters = 0
    for page_number, page in enumerate(reader.pages, start=1):
        page_text = _extract_page_text(page)
        if not page_text:
            continue

        remaining = MAX_EXTRACTED_CHARACTERS - extracted_characters
        if remaining <= 0:
            break
        if len(page_text) > remaining:
            page_text = page_text[:remaining].rstrip()

        page_sections.append(f"[Trang {page_number}]\n{page_text}")
        extracted_characters += len(page_text)

    if not page_sections:
        raise PdfExtractionError(
            f"PDF {path.name} không có text trích xuất được. "
            "Đây có thể là PDF scan; cần chạy OCR trước khi đưa vào RAG."
        )

    return "\n\n".join(page_sections)


def load_documents_from_directory(data_dir: Path) -> list[LawDocument]:
    documents: list[LawDocument] = []
    if not data_dir.exists():
        return documents

    mapping = {
        "hon_nhan": ("Hôn nhân gia đình", "Luật Hôn nhân và gia đình"),
        "dat_dai": ("Đất đai", "Luật Đất đai"),
        "hinh_su": ("Hình sự", "Bộ luật Hình sự / BLTTHS"),
        "doanh_nghiep": ("Doanh nghiệp", "Luật Doanh nghiệp"),
    }

    for path in sorted(data_dir.rglob("*")):
        if not path.is_file():
            continue
        suffix = path.suffix.lower()
        if suffix not in {".txt", ".pdf"}:
            continue

        meta = _read_meta(path)
        specialization = meta.get("specialization")
        document_title = meta.get("title")

        if not specialization or not document_title:
            for prefix, (mapped_specialization, mapped_title) in mapping.items():
                if path.stem.startswith(prefix) or prefix in path.stem:
                    specialization = specialization or mapped_specialization
                    document_title = document_title or mapped_title
                    break

        specialization = specialization or "Tổng quát"
        document_title = document_title or path.stem.replace("_", " ").title()

        try:
            content = _read_txt(path) if suffix == ".txt" else _read_pdf(path)
        except DocumentLoadError:
            if PDF_STRICT_MODE:
                raise
            logger.exception(
                "Bỏ qua tài liệu %s vì không thể trích xuất an toàn.",
                path.name,
            )
            continue

        if not content:
            logger.warning("Bỏ qua tài liệu rỗng: %s.", path.name)
            continue

        documents.append(
            LawDocument(
                doc_id=path.stem,
                title=document_title,
                specialization=specialization,
                file_path=path,
                content=content,
            )
        )

    return documents


__all__ = [
    "DocumentLoadError",
    "LawDocument",
    "PdfExtractionError",
    "_read_pdf",
    "_read_txt",
    "load_documents_from_directory",
]
