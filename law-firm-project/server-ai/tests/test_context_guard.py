import unittest

from app.services.context_guard import assess_context


class ContextGuardTests(unittest.TestCase):
    def test_robbery_question_only_asks_for_missing_facts(self):
        result = assess_context('tôi vừa cướp tiệm vàng, tôi sẽ đi tù bao lâu?')

        self.assertTrue(result.needs_more_context)
        self.assertIn('Tổng giá trị vàng', result.answer)
        self.assertIn('dùng súng, dao', result.answer)
        self.assertNotIn('03 năm đến 10 năm', result.answer)

    def test_partial_answers_only_leave_unanswered_questions(self):
        history = [
            {'role': 'user', 'content': 'tôi vừa cướp tiệm vàng'},
            {'role': 'assistant', 'content': 'Hãy cung cấp thêm dữ kiện.'},
            {'role': 'user', 'content': 'Khoảng 300 triệu, tôi dùng dao nhưng không ai bị thương.'},
        ]

        result = assess_context('Tôi thực hiện một mình.', history)

        self.assertTrue(result.needs_more_context)
        self.assertNotIn('Tổng giá trị vàng', result.answer)
        self.assertNotIn('dùng súng, dao', result.answer)
        self.assertIn('bao nhiêu tuổi', result.answer)

    def test_complete_robbery_context_allows_analysis(self):
        history = [
            {'role': 'user', 'content': 'tôi vừa cướp tiệm vàng'},
            {
                'role': 'user',
                'content': 'Tài sản 300 triệu, có dùng dao, không ai bị thương, tôi làm một mình và tôi 25 tuổi.',
            },
        ]

        result = assess_context('Bây giờ hãy phân tích mức án.', history)

        self.assertFalse(result.needs_more_context)
        self.assertEqual(result.specialization, 'Hình sự')

    def test_natural_gold_quantity_death_count_and_gang_are_recognized(self):
        history = [
            {'role': 'user', 'content': 'tôi vừa cướp tiệm vàng, tôi sẽ đi tù bao lâu?'},
        ]

        result = assess_context(
            'Cướp 10 cây, dùng súng, chết 500 người, cùng đồng bọn, 12 tuổi',
            history,
        )

        self.assertFalse(result.needs_more_context)
        self.assertEqual(result.specialization, 'Hình sự')

    def test_reversed_death_phrase_and_natural_group_wording_are_recognized(self):
        history = [
            {
                'role': 'user',
                'content': 'cướp 10 cây vàng, có dùng súng, có 100 người chết, tôi có 10 người bạn cùng chí hướng, lúc đó mới 15 tuổi',
            },
        ]

        result = assess_context('Bây giờ phân tích giúp tôi.', history)

        self.assertFalse(result.needs_more_context)

    def test_organizer_and_participant_count_are_recognized(self):
        history = [
            {'role': 'user', 'content': 'tôi vừa cướp tiệm vàng'},
            {'role': 'user', 'content': '10 cây vàng, có súng, có 100 người chết, lúc đó 15 tuổi'},
        ]

        result = assess_context('tôi là người tổ chức, có 2 người tham gia', history)

        self.assertFalse(result.needs_more_context)


if __name__ == '__main__':
    unittest.main()
