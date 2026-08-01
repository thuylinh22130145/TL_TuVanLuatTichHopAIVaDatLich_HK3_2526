import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

from app.services.document_loader import LawDocument
from app.services.rag_retriever import (
    EMBEDDING_DIMENSIONS,
    GeminiVectorIndex,
    RAGRetriever,
    _chunk_document,
    _cosine_similarity,
    _keyword_search,
)


def unit_vector(index: int) -> list[float]:
    vector = [0.0] * EMBEDDING_DIMENSIONS
    vector[index] = 1.0
    return vector


class VectorRetrieverTests(unittest.TestCase):
    def test_cosine_similarity(self):
        self.assertAlmostEqual(
            _cosine_similarity([1.0, 0.0], [1.0, 0.0]),
            1.0,
        )
        self.assertAlmostEqual(
            _cosine_similarity([1.0, 0.0], [0.0, 1.0]),
            0.0,
        )

    def test_vector_search_uses_document_and_query_task_types(self):
        with tempfile.TemporaryDirectory() as directory:
            data_path = Path(directory)
            documents = [
                LawDocument(
                    doc_id="dat-dai",
                    title="Luật Đất đai",
                    specialization="Đất đai",
                    file_path=data_path / "dat-dai.txt",
                    content="Quy định về giấy chứng nhận quyền sử dụng đất.",
                ),
                LawDocument(
                    doc_id="hon-nhan",
                    title="Luật Hôn nhân và gia đình",
                    specialization="Hôn nhân gia đình",
                    file_path=data_path / "hon-nhan.txt",
                    content="Quy định về thủ tục ly hôn và quyền nuôi con.",
                ),
            ]
            models = Mock()

            def embed_content(*, model, contents, config):
                if config.task_type == "RETRIEVAL_DOCUMENT":
                    return SimpleNamespace(
                        embeddings=[
                            SimpleNamespace(values=unit_vector(0)),
                            SimpleNamespace(values=unit_vector(1)),
                        ]
                    )
                self.assertEqual(config.task_type, "RETRIEVAL_QUERY")
                return SimpleNamespace(
                    embeddings=[SimpleNamespace(values=unit_vector(1))]
                )

            models.embed_content.side_effect = embed_content
            index = GeminiVectorIndex(data_path)

            with patch(
                "app.services.rag_retriever._get_client",
                return_value=SimpleNamespace(models=models),
            ):
                result = index.search("Tôi muốn ly hôn", documents)

            self.assertEqual(result.backend, "gemini_vector")
            self.assertEqual(result.document.doc_id, "hon-nhan")
            self.assertEqual(result.score, 1.0)
            self.assertTrue(result.is_high_confidence)
            calls = models.embed_content.call_args_list
            self.assertEqual(calls[0].kwargs["model"], "gemini-embedding-001")
            self.assertEqual(
                calls[0].kwargs["config"].task_type,
                "RETRIEVAL_DOCUMENT",
            )
            self.assertEqual(
                calls[1].kwargs["config"].task_type,
                "RETRIEVAL_QUERY",
            )

    def test_chunk_keeps_pdf_page_metadata(self):
        document = LawDocument(
            doc_id="legal-pdf",
            title="Legal PDF",
            specialization="General",
            file_path=Path("legal.pdf"),
            content="[Trang 7]\nFirst paragraph.\n\nSecond paragraph on the same page.",
        )

        chunks = _chunk_document(document)

        self.assertTrue(chunks)
        self.assertTrue(all(chunk.pages == (7,) for chunk in chunks))
    def test_keyword_search_prefers_robbery_penalty_over_cross_reference(self):
        document = LawDocument(
            doc_id='hinh-su',
            title='Bộ luật Hình sự',
            specialization='Hình sự',
            file_path=Path('hinh-su.txt'),
            content=(
                'Danh sách dẫn chiếu: Điều 168 (tội cướp tài sản); Điều 169.\n\n'
                + ('Nội dung không liên quan. ' * 70)
                + '\n\nĐiều 168. Tội cướp tài sản. Người phạm tội bị phạt tù từ 03 năm đến 10 năm.'
            ),
        )

        result = _keyword_search('cướp tiệm vàng đi tù bao lâu', [document])

        self.assertIn('phạt tù từ 03 năm đến 10 năm', result.matched_chunks[0])

    def test_keyword_search_prioritizes_criminal_responsibility_age(self):
        document = LawDocument(
            doc_id='hinh-su',
            title='Bộ luật Hình sự',
            specialization='Hình sự',
            file_path=Path('hinh-su.txt'),
            content=(
                'Tha tù trước thời hạn đối với tội cướp tài sản.\n\n'
                + ('Nội dung khác. ' * 90)
                + '\n\nĐiều 12. Tuổi chịu trách nhiệm hình sự. Người từ đủ 14 tuổi trở lên chịu trách nhiệm hình sự theo quy định.'
            ),
        )

        result = _keyword_search('cướp tài sản, 12 tuổi, đi tù bao lâu', [document])

        self.assertIn('Tuổi chịu trách nhiệm hình sự', result.matched_chunks[0])

    def test_keyword_fallback_is_reported_when_gemini_is_not_configured(self):
        retriever = RAGRetriever()
        retriever._documents = [
            LawDocument(
                doc_id="dat-dai",
                title="Luật Đất đai",
                specialization="Đất đai",
                file_path=Path("dat-dai.txt"),
                content="Cấp giấy chứng nhận quyền sử dụng đất.",
            )
        ]

        with patch(
            "app.services.rag_retriever.is_gemini_configured",
            return_value=False,
        ):
            result = retriever.retrieve("giấy chứng nhận sử dụng đất")

        self.assertEqual(result.backend, "keyword_fallback")
        self.assertIsNone(result.embedding_model)
        self.assertEqual(result.document.doc_id, "dat-dai")


if __name__ == "__main__":
    unittest.main()
