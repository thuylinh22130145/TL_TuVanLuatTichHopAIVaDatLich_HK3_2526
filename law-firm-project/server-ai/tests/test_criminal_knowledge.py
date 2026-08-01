import unittest

from app.core.config import settings


class CriminalKnowledgeTests(unittest.TestCase):
    def test_murder_penalty_and_multiple_victims_are_in_knowledge_base(self):
        content = (settings.data_path / 'hinh_su.txt').read_text(encoding='utf-8')

        self.assertIn('ĐIỀU 123 — TỘI GIẾT NGƯỜI', content)
        self.assertIn('giết 02 người trở lên', content)
        self.assertIn('12 năm đến 20 năm tù, tù chung thân hoặc tử hình', content)
        self.assertIn('Không được kết luận trước', content)


if __name__ == '__main__':
    unittest.main()
