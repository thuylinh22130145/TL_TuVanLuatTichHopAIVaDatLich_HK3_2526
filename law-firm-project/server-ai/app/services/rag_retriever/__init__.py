"""Gemini embedding vector search with an explicit keyword fallback.

This package intentionally has the same import name as the legacy
``app.services.rag_retriever`` module. Python loads this package first, allowing
the project to keep the old experimental implementation for comparison while
all existing imports transparently use the real vector retriever.
"""

from __future__ import annotations

import hashlib
import json
import logging
import math
import os
import re
import tempfile
import threading
import unicodedata
from contextvars import ContextVar
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.services.document_loader import LawDocument, load_documents_from_directory
from app.services.gemini_service import _get_client, is_gemini_configured


logger = logging.getLogger(__name__)

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
EMBEDDING_DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", "768"))
VECTOR_SIMILARITY_THRESHOLD = float(
    os.getenv("VECTOR_SIMILARITY_THRESHOLD", "0.5")
)
KEYWORD_SIMILARITY_THRESHOLD = float(
    os.getenv(
        "KEYWORD_SIMILARITY_THRESHOLD",
        str(settings.rag_similarity_threshold),
    )
)
RETRIEVAL_TOP_K = max(1, int(os.getenv("RETRIEVAL_TOP_K", "3")))
CHUNK_SIZE = max(300, int(os.getenv("EMBEDDING_CHUNK_SIZE", "1200")))
CHUNK_OVERLAP = max(0, int(os.getenv("EMBEDDING_CHUNK_OVERLAP", "200")))
EMBEDDING_BATCH_SIZE = max(1, int(os.getenv("EMBEDDING_BATCH_SIZE", "16")))

_retrieval_metadata: ContextVar[dict[str, Any]] = ContextVar(
    "retrieval_metadata",
    default={
        "backend": "none",
        "embedding_model": None,
        "matched_chunk_count": 0,
    },
)


@dataclass(frozen=True)
class DocumentChunk:
    chunk_id: str
    document: LawDocument
    index: int
    content: str
    fingerprint: str
    pages: tuple[int, ...] = ()


@dataclass
class RetrievalResult:
    document: LawDocument | None
    score: float
    matched_chunks: list[str]
    is_high_confidence: bool
    citation_pages: list[int] = field(default_factory=list)
    backend: str = "none"
    embedding_model: str | None = None


def get_retrieval_metadata() -> dict[str, Any]:
    """Return metadata for the current request context."""
    return dict(_retrieval_metadata.get())


def _set_retrieval_metadata(result: RetrievalResult) -> None:
    _retrieval_metadata.set(
        {
            "backend": result.backend,
            "embedding_model": result.embedding_model,
            "matched_chunk_count": len(result.matched_chunks),
        }
    )


def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower().strip())
    text = "".join(
        character
        for character in text
        if unicodedata.category(character) != "Mn"
    )
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text)


def _tokenize(text: str) -> set[str]:
    normalized = _normalize(text).replace('đ', 'd')
    return {
        token
        for token in normalized.split()
        if len(token) > 2
    }


def _split_long_text(text: str) -> list[str]:
    words = text.split()
    if not words:
        return []

    chunks: list[str] = []
    current: list[str] = []
    current_length = 0

    for word in words:
        added_length = len(word) + (1 if current else 0)
        if current and current_length + added_length > CHUNK_SIZE:
            chunk = " ".join(current).strip()
            if chunk:
                chunks.append(chunk)

            if CHUNK_OVERLAP:
                overlap: list[str] = []
                overlap_length = 0
                for previous_word in reversed(current):
                    next_length = len(previous_word) + (1 if overlap else 0)
                    if overlap_length + next_length > CHUNK_OVERLAP:
                        break
                    overlap.insert(0, previous_word)
                    overlap_length += next_length
                current = overlap
                current_length = len(" ".join(current))
            else:
                current = []
                current_length = 0

        current.append(word)
        current_length += added_length

    final_chunk = " ".join(current).strip()
    if final_chunk:
        chunks.append(final_chunk)
    return chunks


_PAGE_MARKER_PATTERN = re.compile(r"\[Trang\s+(\d+)\]", re.IGNORECASE)


def _page_numbers(text: str) -> tuple[int, ...]:
    return tuple(
        sorted({int(value) for value in _PAGE_MARKER_PATTERN.findall(text)})
    )


def _chunk_document(document: LawDocument) -> list[DocumentChunk]:
    raw_sections = [
        section.strip()
        for section in re.split(r"\n\s*\n", document.content)
        if section.strip()
    ]
    if not raw_sections and document.content.strip():
        raw_sections = [document.content.strip()]

    chunk_entries: list[tuple[str, tuple[int, ...]]] = []
    buffer = ""
    buffer_pages: set[int] = set()
    current_pages: tuple[int, ...] = ()
    for section in raw_sections:
        explicit_pages = _page_numbers(section)
        if explicit_pages:
            current_pages = explicit_pages
        section_pages = explicit_pages or current_pages

        if len(section) > CHUNK_SIZE:
            if buffer:
                chunk_entries.append((buffer, tuple(sorted(buffer_pages))))
                buffer = ""
                buffer_pages = set()
            chunk_entries.extend(
                (part, section_pages)
                for part in _split_long_text(section)
            )
        elif not buffer:
            buffer = section
            buffer_pages = set(section_pages)
        elif len(buffer) + len(section) + 2 <= CHUNK_SIZE:
            buffer = f"{buffer}\n\n{section}"
            buffer_pages.update(section_pages)
        else:
            chunk_entries.append((buffer, tuple(sorted(buffer_pages))))
            buffer = section
            buffer_pages = set(section_pages)
    if buffer:
        chunk_entries.append((buffer, tuple(sorted(buffer_pages))))

    chunks: list[DocumentChunk] = []
    for index, (content, pages) in enumerate(chunk_entries):
        embedding_input = (
            f"Tiêu đề: {document.title}\n"
            f"Lĩnh vực: {document.specialization}\n"
            f"Nội dung: {content}"
        )
        fingerprint = hashlib.sha256(
            (
                f"{EMBEDDING_MODEL}:{EMBEDDING_DIMENSIONS}:"
                f"{document.doc_id}:{embedding_input}"
            ).encode("utf-8")
        ).hexdigest()
        chunks.append(
            DocumentChunk(
                chunk_id=f"{document.doc_id}:{index}",
                document=document,
                index=index,
                content=content,
                fingerprint=fingerprint,
                pages=pages,
            )
        )
    return chunks


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or len(left) != len(right):
        return 0.0
    dot_product = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if left_norm == 0.0 or right_norm == 0.0:
        return 0.0
    return dot_product / (left_norm * right_norm)


def _embedding_values(response: Any) -> list[list[float]]:
    embeddings = getattr(response, "embeddings", None) or []
    values: list[list[float]] = []
    for embedding in embeddings:
        vector = getattr(embedding, "values", None)
        if not vector:
            raise RuntimeError("Gemini không trả về vector embedding hợp lệ.")
        values.append([float(item) for item in vector])
    return values


class GeminiVectorIndex:
    def __init__(self, data_path: Path):
        self.data_path = data_path
        configured_cache = os.getenv("VECTOR_CACHE_PATH", "").strip()
        self.cache_path = (
            Path(configured_cache)
            if configured_cache
            else data_path / ".embedding_cache.json"
        )
        self._chunks: list[DocumentChunk] = []
        self._vectors: dict[str, list[float]] = {}
        self._ready = False
        self._lock = threading.RLock()

    def invalidate(self) -> None:
        with self._lock:
            self._chunks = []
            self._vectors = {}
            self._ready = False

    def _load_cache(self) -> dict[str, list[float]]:
        if not self.cache_path.exists():
            return {}
        try:
            payload = json.loads(self.cache_path.read_text(encoding="utf-8"))
            if (
                payload.get("model") != EMBEDDING_MODEL
                or payload.get("dimensions") != EMBEDDING_DIMENSIONS
            ):
                return {}
            entries = payload.get("entries", {})
            return {
                fingerprint: [float(value) for value in vector]
                for fingerprint, vector in entries.items()
                if isinstance(vector, list)
                and len(vector) == EMBEDDING_DIMENSIONS
            }
        except (OSError, ValueError, TypeError):
            logger.warning("Không đọc được vector cache; hệ thống sẽ tạo lại.")
            return {}

    def _save_cache(self) -> None:
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "model": EMBEDDING_MODEL,
            "dimensions": EMBEDDING_DIMENSIONS,
            "entries": self._vectors,
        }
        temporary_path: Path | None = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="w",
                encoding="utf-8",
                dir=self.cache_path.parent,
                prefix=".embedding-cache-",
                suffix=".tmp",
                delete=False,
            ) as temporary_file:
                json.dump(payload, temporary_file, ensure_ascii=False)
                temporary_path = Path(temporary_file.name)
            temporary_path.replace(self.cache_path)
        finally:
            if temporary_path and temporary_path.exists():
                temporary_path.unlink(missing_ok=True)

    @staticmethod
    def _document_embedding_input(chunk: DocumentChunk) -> str:
        return (
            f"Tiêu đề: {chunk.document.title}\n"
            f"Lĩnh vực: {chunk.document.specialization}\n"
            f"Nội dung: {chunk.content}"
        )

    def _embed_documents(self, chunks: list[DocumentChunk]) -> list[list[float]]:
        from google.genai import types

        response = _get_client().models.embed_content(
            model=EMBEDDING_MODEL,
            contents=[self._document_embedding_input(chunk) for chunk in chunks],
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_DOCUMENT",
                output_dimensionality=EMBEDDING_DIMENSIONS,
            ),
        )
        values = _embedding_values(response)
        if len(values) != len(chunks):
            raise RuntimeError(
                "Số vector Gemini trả về không khớp số chunk tài liệu."
            )
        return values

    @staticmethod
    def embed_query(query: str) -> list[float]:
        from google.genai import types

        response = _get_client().models.embed_content(
            model=EMBEDDING_MODEL,
            contents=query,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_QUERY",
                output_dimensionality=EMBEDDING_DIMENSIONS,
            ),
        )
        values = _embedding_values(response)
        if len(values) != 1:
            raise RuntimeError("Gemini không trả về đúng một vector câu hỏi.")
        return values[0]

    def ensure_ready(self, documents: list[LawDocument]) -> None:
        with self._lock:
            if self._ready:
                return

            self._chunks = [
                chunk
                for document in documents
                for chunk in _chunk_document(document)
            ]
            cached_vectors = self._load_cache()
            self._vectors = {
                chunk.fingerprint: cached_vectors[chunk.fingerprint]
                for chunk in self._chunks
                if chunk.fingerprint in cached_vectors
            }

            missing_chunks = [
                chunk
                for chunk in self._chunks
                if chunk.fingerprint not in self._vectors
            ]
            for start in range(0, len(missing_chunks), EMBEDDING_BATCH_SIZE):
                batch = missing_chunks[start : start + EMBEDDING_BATCH_SIZE]
                vectors = self._embed_documents(batch)
                for chunk, vector in zip(batch, vectors):
                    self._vectors[chunk.fingerprint] = vector

            if missing_chunks:
                self._save_cache()
            self._ready = True

    def search(
        self,
        query: str,
        documents: list[LawDocument],
    ) -> RetrievalResult:
        self.ensure_ready(documents)
        if not self._chunks:
            return RetrievalResult(
                document=None,
                score=0.0,
                matched_chunks=[],
                is_high_confidence=False,
                backend="gemini_vector",
                embedding_model=EMBEDDING_MODEL,
            )

        query_vector = self.embed_query(query)
        scored = sorted(
            (
                (
                    _cosine_similarity(
                        query_vector,
                        self._vectors.get(chunk.fingerprint, []),
                    ),
                    chunk,
                )
                for chunk in self._chunks
            ),
            key=lambda item: item[0],
            reverse=True,
        )

        best_score, best_chunk = scored[0]
        same_document = [
            (score, chunk)
            for score, chunk in scored
            if chunk.document.doc_id == best_chunk.document.doc_id
        ][:RETRIEVAL_TOP_K]
        score = round(max(0.0, min(1.0, best_score)), 4)
        return RetrievalResult(
            document=best_chunk.document,
            score=score,
            matched_chunks=[chunk.content for _, chunk in same_document],
            is_high_confidence=score >= VECTOR_SIMILARITY_THRESHOLD,
            citation_pages=sorted(
                {
                    page
                    for _, chunk in same_document
                    for page in chunk.pages
                }
            ),
            backend="gemini_vector",
            embedding_model=EMBEDDING_MODEL,
        )


def _keyword_search(
    query: str,
    documents: list[LawDocument],
) -> RetrievalResult:
    query_tokens = _tokenize(query)
    normalized_query = _normalize(query).replace('đ', 'd')
    age_match = re.search(r'\b(\d{1,2})\s*tuoi\b', normalized_query)
    stated_age = int(age_match.group(1)) if age_match else None
    best_document: LawDocument | None = None
    best_score = 0.0
    best_chunks: list[DocumentChunk] = []

    for document in documents:
        document_chunks = _chunk_document(document)
        specialization_tokens = _tokenize(document.specialization)
        for chunk in document_chunks:
            chunk_tokens = _tokenize(
                f"{document.title} {document.specialization} {chunk.content}"
            )
            overlap = query_tokens & chunk_tokens
            score = len(overlap) / max(len(query_tokens), 1)
            if query_tokens & specialization_tokens:
                score = min(1.0, score + 0.25)
            normalized_chunk = _normalize(chunk.content).replace('đ', 'd')
            if 'cuop' in normalized_query and 'cuop giat' not in normalized_query and 'toi cuop tai san' in normalized_chunk:
                score += 0.2
                if 'phat tu' in normalized_chunk:
                    score += 0.35
            if 'bao lau' in normalized_query and 'phat tu' in normalized_chunk:
                score += 0.15
            if (
                stated_age is not None
                and stated_age < 14
                and 'tuoi chiu trach nhiem hinh su' in normalized_chunk
                and 'tu du 14 tuoi' in normalized_chunk
            ):
                score += 0.9
            if score > best_score:
                best_score = score
                best_document = document
                best_chunks = [chunk]
            elif (
                best_document
                and document.doc_id == best_document.doc_id
                and score > 0
                and len(best_chunks) < RETRIEVAL_TOP_K
            ):
                best_chunks.append(chunk)

    score = round(min(best_score, 1.0), 4)
    return RetrievalResult(
        document=best_document,
        score=score,
        matched_chunks=[chunk.content for chunk in best_chunks],
        is_high_confidence=score >= KEYWORD_SIMILARITY_THRESHOLD,
        citation_pages=sorted(
            {page for chunk in best_chunks for page in chunk.pages}
        ),
        backend="keyword_fallback",
        embedding_model=None,
    )


class RAGRetriever:
    def __init__(self):
        self._documents: list[LawDocument] | None = None
        self._vector_index = GeminiVectorIndex(settings.data_path)

    @property
    def documents(self) -> list[LawDocument]:
        if self._documents is None:
            self._documents = load_documents_from_directory(settings.data_path)
        return self._documents

    def reload(self) -> int:
        self._documents = load_documents_from_directory(settings.data_path)
        self._vector_index.invalidate()
        return len(self._documents)

    def retrieve(self, query: str) -> RetrievalResult:
        if not query.strip() or not self.documents:
            result = RetrievalResult(
                document=None,
                score=0.0,
                matched_chunks=[],
                is_high_confidence=False,
            )
            _set_retrieval_metadata(result)
            return result

        if is_gemini_configured():
            try:
                result = self._vector_index.search(query, self.documents)
                _set_retrieval_metadata(result)
                return result
            except Exception as error:
                logger.warning(
                    "Gemini vector search không khả dụng; dùng keyword fallback: %s",
                    error,
                )

        result = _keyword_search(query, self.documents)
        _set_retrieval_metadata(result)
        return result


# Backward-compatible name for code and tests that referenced the old class.
MockRAGRetriever = RAGRetriever
retriever = RAGRetriever()
