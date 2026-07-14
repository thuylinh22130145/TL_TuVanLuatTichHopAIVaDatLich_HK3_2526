"""
Tải tài liệu luật cục bộ từ app/data (txt, pdf giả lập).
Metadata: file {doc_id}.meta.json (title, specialization).
"""
import json
from dataclasses import dataclass
from pathlib import Path


@dataclass
class LawDocument:
    doc_id: str
    title: str
    specialization: str
    file_path: Path
    content: str


def _read_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def _read_meta(path: Path) -> dict:
    meta_path = path.parent / f"{path.stem}.meta.json"
    if not meta_path.exists():
        return {}
    try:
        return json.loads(meta_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def _read_pdf_mock(path: Path) -> str:
    """PDF: giả lập — trích xuất tên file làm metadata, nội dung placeholder."""
    stem = path.stem.replace("_", " ")
    return (
        f"[MOCK PDF] Tài liệu: {stem}. "
        "Nội dung đầy đủ sẽ được trích xuất bằng PyPDF2/pdfplumber khi tích hợp thật."
    )


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
        if suffix not in (".txt", ".pdf"):
            continue

        meta = _read_meta(path)
        specialization = meta.get("specialization")
        doc_title = meta.get("title")

        if not specialization or not doc_title:
            for prefix, (spec, title) in mapping.items():
                if path.stem.startswith(prefix) or prefix in path.stem:
                    specialization = specialization or spec
                    doc_title = doc_title or title
                    break

        specialization = specialization or "Tổng quát"
        doc_title = doc_title or path.stem.replace("_", " ").title()

        content = _read_txt(path) if suffix == ".txt" else _read_pdf_mock(path)
        documents.append(
            LawDocument(
                doc_id=path.stem,
                title=doc_title,
                specialization=specialization,
                file_path=path,
                content=content,
            )
        )

    return documents
