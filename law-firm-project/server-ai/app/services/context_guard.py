'''Deterministic context checks for legal questions whose outcome depends on key facts.'''

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True)
class ContextAssessment:
    needs_more_context: bool
    answer: str | None = None
    specialization: str = 'Tổng quát'


def _normalize(value: str) -> str:
    value = unicodedata.normalize('NFD', value.lower())
    value = ''.join(character for character in value if unicodedata.category(character) != 'Mn')
    value = value.replace('đ', 'd')
    return re.sub(r'\s+', ' ', value).strip()


def _contains_any(text: str, phrases: tuple[str, ...]) -> bool:
    return any(phrase in text for phrase in phrases)


def assess_context(message: str, conversation_history: list[dict] | None = None) -> ContextAssessment:
    user_messages = [
        str(item.get('content') or '')
        for item in (conversation_history or [])
        if item.get('role') == 'user'
    ]
    combined = _normalize('\n'.join([*user_messages, message]))

    is_robbery = 'cuop' in combined and 'cuop giat' not in combined
    if not is_robbery:
        return ContextAssessment(needs_more_context=False)

    facts = {
        'value': bool(
            re.search(
                r'\b\d[\d.,]*\s*(dong|trieu|ty|cay|luong|chi|kg|gam|gram)\b',
                combined,
            )
        )
        or _contains_any(combined, ('khong ro gia tri', 'chua biet gia tri')),
        'weapon': _contains_any(
            combined,
            (
                'sung', 'dao', 'vu khi', 'hung khi', 'de doa', 'dung vu luc',
                'hanh hung', 'khong dung vu khi', 'khong de doa', 'khong hanh hung',
            ),
        ),
        'harm': 'chet' in combined or _contains_any(
            combined,
            (
                'bi thuong', 'thuong tich', 'tu vong', 'chet nguoi', 'khong ai bi thuong',
                'khong co thuong tich', 'khong ai chet',
            ),
        ),
        'participants': bool(
            re.search(
                r'\b\d+\s+nguoi\s+(ban|tham gia|dong bon|dong pham)\b',
                combined,
            )
        ) or _contains_any(
            combined,
            (
                'mot minh', 'dong pham', 'dong bon', 'cung tham gia', 'cung dong bon',
                'co nguoi giup', 'co to chuc', 'nguoi to chuc', 'nguoi tham gia',
                'theo nhom', 'nguoi ban', 'ban cung chi huong', 'cung chi huong',
            ),
        ),
        'age': bool(re.search(r'\b\d{1,2}\s*tuoi\b', combined))
        or _contains_any(combined, ('duoi 18 tuoi', 'chua du 18 tuoi')),
    }

    questions = []
    if not facts['value']:
        questions.append('Tổng giá trị vàng hoặc tài sản đã chiếm đoạt là bao nhiêu?')
    if not facts['weapon']:
        questions.append('Bạn có dùng súng, dao, vũ khí, hành hung hoặc đe dọa dùng vũ lực ngay tức khắc không?')
    if not facts['harm']:
        questions.append('Có ai bị thương hoặc tử vong không; nếu có thương tích thì tỷ lệ giám định là bao nhiêu?')
    if not facts['participants']:
        questions.append('Bạn thực hiện một mình hay có người tổ chức, giúp sức hoặc cùng tham gia?')
    if not facts['age']:
        questions.append('Bạn bao nhiêu tuổi tại thời điểm xảy ra sự việc?')

    if not questions:
        return ContextAssessment(needs_more_context=False, specialization='Hình sự')

    numbered_questions = '\n'.join(
        f'{index}. {question}' for index, question in enumerate(questions, start=1)
    )
    answer = (
        '## Chưa đủ dữ kiện để xác định khung hình phạt\n\n'
        'Mình đã ghi nhận rằng bạn nói vừa cướp một tiệm vàng. Tuy nhiên, các dữ kiện còn thiếu dưới đây '
        'có thể làm thay đổi trực tiếp tội danh hoặc khung hình phạt nên mình chưa đưa ra mức án lúc này.\n\n'
        f'## Bạn cần trả lời thêm\n\n{numbered_questions}\n\n'
        'Bạn hãy trả lời lần lượt các câu trên. Hệ thống sẽ ghi nhớ câu trả lời và chỉ phân tích mức án, '
        'sau đó gợi ý luật sư hình sự, khi đã có đủ dữ kiện cần thiết.\n\n'
        '> Nếu hiện còn người bị thương hoặc có nguy cơ tiếp tục bị hại, hãy dừng mọi hành vi nguy hiểm và tìm hỗ trợ khẩn cấp ngay.'
    )
    return ContextAssessment(
        needs_more_context=True,
        answer=answer,
        specialization='Hình sự',
    )
