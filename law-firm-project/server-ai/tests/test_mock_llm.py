import unittest

from app.services.mock_llm import generate_answer


class MockLlmTests(unittest.TestCase):
    def test_criminal_fallback_analyzes_multiple_roles(self):
        answer = generate_answer(
            question='cướp giật',
            context='Tài liệu hình sự nội bộ.',
            source_label='internal_rag',
            doc_specialization='Hình sự',
        )

        self.assertIn('Nếu bạn là người bị hại', answer)
        self.assertIn('Nếu bạn là người bị tố giác hoặc bị buộc tội', answer)
        self.assertIn('Nếu bạn là người làm chứng hoặc người thân', answer)
        self.assertIn('Thông tin cần bổ sung', answer)
        self.assertIn('Căn cứ từ kho dữ liệu', answer)

    def test_murder_fallback_explains_applicable_penalty_range(self):
        answer = generate_answer(
            question='tôi đã giết 5 người',
            context='Điều 123 quy định 12 năm đến 20 năm tù, tù chung thân hoặc tử hình.',
            source_label='internal_rag',
            doc_specialization='Hình sự',
        )

        self.assertIn('điểm a khoản 1 Điều 123', answer)
        self.assertIn('12 năm đến 20 năm tù', answer)
        self.assertIn('không phải kết luận về mức án cụ thể', answer)

    def test_robbery_fallback_explains_ranges_without_dumping_raw_context(self):
        answer = generate_answer(
            question='tôi vừa cướp tiệm vàng, tôi sẽ đi tù bao lâu?',
            context='Tài liệu: Bộ luật Hình sự\nĐiều 168. Tội cướp tài sản, phạt tù từ 03 năm đến 10 năm; các khung 07 năm đến 15 năm, 12 năm đến 20 năm, 18 năm đến 20 năm hoặc tù chung thân.',
            source_label='internal_rag',
            doc_specialization='Hình sự',
        )

        self.assertIn('03 năm đến 10 năm tù', answer)
        self.assertIn('giá trị vàng', answer)
        self.assertIn('không hiển thị đoạn trích thô', answer)
        self.assertNotIn('Nội dung tìm được:', answer)

    def test_robbery_fallback_explains_ranges_without_dumping_raw_context(self):
        answer = generate_answer(
            question='tôi vừa cướp tiệm vàng, tôi sẽ đi tù bao lâu?',
            context='Tài liệu: Bộ luật Hình sự\nĐiều 168. Tội cướp tài sản, phạt tù từ 03 năm đến 10 năm; các khung 07 năm đến 15 năm, 12 năm đến 20 năm, 18 năm đến 20 năm hoặc tù chung thân.',
            source_label='internal_rag',
            doc_specialization='Hình sự',
        )

        self.assertIn('03 năm đến 10 năm tù', answer)
        self.assertIn('giá trị vàng', answer)
        self.assertIn('không hiển thị đoạn trích thô', answer)
        self.assertNotIn('Nội dung tìm được:', answer)


if __name__ == '__main__':
    unittest.main()
