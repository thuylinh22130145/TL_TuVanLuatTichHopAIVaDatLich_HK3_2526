import unittest

from app.services.specialization import detect_specialization


class SpecializationTests(unittest.TestCase):
    def test_short_murder_query_is_criminal_law(self):
        self.assertEqual(detect_specialization('giết người'), 'Hình sự')

    def test_common_criminal_conduct_is_classified(self):
        cases = [
            'cố ý gây thương tích',
            'trộm cắp tài sản',
            'cướp giật',
            'lừa đảo chiếm đoạt tài sản',
            'tàng trữ ma túy',
        ]
        for question in cases:
            with self.subTest(question=question):
                self.assertEqual(detect_specialization(question), 'Hình sự')

    def test_question_has_priority_over_wrong_document_fallback(self):
        self.assertEqual(
            detect_specialization(
                'giết người',
                fallback_from_doc='Doanh nghiệp',
            ),
            'Hình sự',
        )

    def test_document_specialization_remains_a_fallback(self):
        self.assertEqual(
            detect_specialization(
                'Tôi cần được tư vấn',
                fallback_from_doc='Đất đai',
            ),
            'Đất đai',
        )

    def test_vietnamese_d_stroke_is_normalized(self):
        self.assertEqual(detect_specialization('tranh chấp đất đai'), 'Đất đai')


if __name__ == '__main__':
    unittest.main()
