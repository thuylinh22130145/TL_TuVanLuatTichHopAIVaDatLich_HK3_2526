import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from app.core.config import settings
from app.services import gemini_service


class GeminiServiceTests(unittest.TestCase):
    def test_blank_api_key_disables_gemini(self):
        with patch.object(settings, 'gemini_api_key', '   '):
            self.assertFalse(gemini_service.is_gemini_configured())

    def test_generate_grounded_answer_uses_official_sdk(self):
        models = Mock()
        models.generate_content.return_value = SimpleNamespace(
            text='Đây là câu trả lời có căn cứ.'
        )
        client = SimpleNamespace(models=models)

        with (
            patch.object(settings, 'gemini_api_key', 'test-key'),
            patch.object(settings, 'gemini_model', 'gemini-3.6-flash'),
            patch.object(settings, 'gemini_max_output_tokens', 1200),
            patch.object(gemini_service, '_get_client', return_value=client),
        ):
            answer = gemini_service.generate_grounded_answer(
                question='Tôi cần tư vấn gì?',
                context='Ngữ cảnh pháp luật nội bộ.',
                source_label='internal_rag',
            )

        self.assertEqual(answer, 'Đây là câu trả lời có căn cứ.')
        call = models.generate_content.call_args
        self.assertEqual(call.kwargs['model'], 'gemini-3.6-flash')
        self.assertIn('Ngữ cảnh pháp luật nội bộ.', call.kwargs['contents'])
        self.assertIn('YÊU CẦU PHÂN TÍCH', call.kwargs['contents'])
        self.assertIn('Không dừng ở việc đánh giá đủ hay thiếu ngữ cảnh', call.kwargs['contents'])
        self.assertIn('Không hướng dẫn trốn tránh', call.kwargs['config'].system_instruction)
        self.assertIn('Trả lời thẳng vào điều người dùng đang cần', call.kwargs['config'].system_instruction)
        self.assertIn('không bắt buộc lặp đủ mọi mục', call.kwargs['config'].system_instruction.lower())
        self.assertEqual(call.kwargs['config'].max_output_tokens, 1200)
        self.assertEqual(call.kwargs['config'].temperature, 0.2)
        self.assertEqual(call.kwargs['config'].top_p, 0.95)

    def test_empty_response_raises_controlled_error(self):
        client = SimpleNamespace(
            models=SimpleNamespace(
                generate_content=Mock(return_value=SimpleNamespace(text=''))
            )
        )
        with (
            patch.object(settings, 'gemini_api_key', 'test-key'),
            patch.object(gemini_service, '_get_client', return_value=client),
        ):
            with self.assertRaisesRegex(
                gemini_service.GeminiUnavailableError,
                'không trả về nội dung',
            ):
                gemini_service.generate_grounded_answer('Câu hỏi', 'Ngữ cảnh', 'internal_rag')


if __name__ == '__main__':
    unittest.main()
