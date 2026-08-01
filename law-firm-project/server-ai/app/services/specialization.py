'''Deterministic legal-domain classification used for lawyer matching.'''
import re
import unicodedata

CATEGORIES: dict[str, list[str]] = {
    'Đất đai': ['dat dai', 'quyen su dung dat', 'so do', 'giay chung nhan', 'tranh chap dat'],
    'Hôn nhân và Gia đình': ['ly hon', 'hon nhan', 'chia tai san', 'nuoi con', 'cap duong'],
    'Hình sự': [
        'hinh su', 'bi can', 'bi cao', 'khoi to', 'bat tam giam',
        'to tung hinh su', 'giet nguoi', 'co y gay thuong tich',
        'trom cap', 'cuop tai san', 'cuop giat', 'lua dao chiem doat',
        'chiem doat tai san', 'ma tuy', 'danh bac', 'tham o',
        'nhan hoi lo', 'toi pham', 'pham toi', 'trach nhiem hinh su',
    ],
    'Doanh nghiệp': ['doanh nghiep', 'cong ty', 'thuong mai', 'co dong', 'gop von', 'hop dong kinh doanh'],
    'Lao động': ['lao dong', 'sa thai', 'bao hiem xa hoi', 'bhxh', 'hop dong lao dong', 'tien luong'],
    'Dân sự': ['dan su', 'thua ke', 'boi thuong', 'vay no', 'hop dong dan su', 'tai san'],
    'Hành chính': ['hanh chinh', 'khieu nai', 'to cao', 'quyet dinh hanh chinh', 'xu phat'],
    'Thuế': ['thue', 'hoa don', 'quyet toan', 'ma so thue'],
}


def _normalize(text: str) -> str:
    value = unicodedata.normalize('NFD', (text or '').lower().replace('đ', 'd'))
    value = ''.join(char for char in value if unicodedata.category(char) != 'Mn')
    value = re.sub(r'[^a-z0-9\s]', ' ', value)
    return re.sub(r'\s+', ' ', value).strip()


def canonicalize_specialization(label: str | None) -> str | None:
    normalized = _normalize(label or '')
    if not normalized:
        return None
    for canonical, keywords in CATEGORIES.items():
        canonical_normalized = _normalize(canonical)
        if canonical_normalized in normalized or normalized in canonical_normalized:
            return canonical
        if any(keyword in normalized for keyword in keywords):
            return canonical
    return None


def detect_specialization(
    question: str,
    answer: str = '',
    fallback_from_doc: str | None = None,
    web_hint: str | None = None,
) -> str:
    def best_match(value: str | None) -> str | None:
        text = _normalize(value or '')
        best_label = None
        best_hits = 0
        for label, keywords in CATEGORIES.items():
            hits = sum(1 for keyword in keywords if keyword in text)
            if hits > best_hits:
                best_label, best_hits = label, hits
        return best_label

    # Dấu hiệu trong câu hỏi luôn đáng tin cậy hơn nhãn của tài liệu RAG.
    # Điều này ngăn tài liệu khớp nhầm ghi đè lĩnh vực người dùng đang hỏi.
    direct_match = best_match(question)
    if direct_match:
        return direct_match

    for fallback in (fallback_from_doc, web_hint):
        fallback_match = best_match(fallback) or canonicalize_specialization(fallback)
        if fallback_match:
            return fallback_match

    return 'Tổng quát'
