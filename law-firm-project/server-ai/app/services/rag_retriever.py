"""
RAG Retriever giả lập — so khớp câu hỏi với kho luật cục bộ (không cần vector DB).
Thay thế bằng LangChain + embeddings khi triển khai production.
"""
import re
import unicodedata
from dataclasses import dataclass

from app.core.config import settings
from app.services.document_loader import LawDocument, load_documents_from_directory


@dataclass
class RetrievalResult:
    document: LawDocument | None
    score: float
    matched_chunks: list[str]
    is_high_confidence: bool


def _normalize(text: str) -> str:
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text)


def _tokenize(text: str) -> set[str]:
    return {t for t in _normalize(text).split() if len(t) > 2}


def _score_query_against_doc(query: str, doc: LawDocument) -> tuple[float, list[str]]:
    q_tokens = _tokenize(query)
    if not q_tokens:
        return 0.0, []

    content_norm = _normalize(doc.content)
    title_norm = _normalize(doc.title + " " + doc.specialization)
    doc_tokens = _tokenize(content_norm + " " + title_norm)

    overlap = q_tokens & doc_tokens
    score = len(overlap) / max(len(q_tokens), 1)

    # Boost từ khóa chuyên ngành trong tên file / specialization
    spec_tokens = _tokenize(doc.specialization)
    spec_overlap = q_tokens & spec_tokens
    if spec_overlap:
        score = min(1.0, score + 0.25 * len(spec_overlap))

    chunks: list[str] = []
    for paragraph in doc.content.split("\n\n"):
        p = paragraph.strip()
        if len(p) < 40:
            continue
        p_tokens = _tokenize(p)
        if q_tokens & p_tokens:
            chunks.append(p[:500])

    if not chunks and doc.content:
        chunks.append(doc.content[:600])

    return round(min(score, 1.0), 4), chunks[:3]


class MockRAGRetriever:
    def __init__(self):
        self._documents: list[LawDocument] | None = None

    @property
    def documents(self) -> list[LawDocument]:
        if self._documents is None:
            self._documents = load_documents_from_directory(settings.data_path)
        return self._documents

    def reload(self) -> int:
        """Tải lại kho tài liệu sau khi admin cập nhật."""
        self._documents = load_documents_from_directory(settings.data_path)
        return len(self._documents)

    def retrieve(self, query: str) -> RetrievalResult:
        if not self.documents:
            return RetrievalResult(
                document=None,
                score=0.0,
                matched_chunks=[],
                is_high_confidence=False,
            )

        best_doc: LawDocument | None = None
        best_score = 0.0
        best_chunks: list[str] = []

        for doc in self.documents:
            score, chunks = _score_query_against_doc(query, doc)
            if score > best_score:
                best_score = score
                best_doc = doc
                best_chunks = chunks

        threshold = settings.rag_similarity_threshold
        return RetrievalResult(
            document=best_doc,
            score=best_score,
            matched_chunks=best_chunks,
            is_high_confidence=best_score >= threshold,
        )


retriever = MockRAGRetriever()
