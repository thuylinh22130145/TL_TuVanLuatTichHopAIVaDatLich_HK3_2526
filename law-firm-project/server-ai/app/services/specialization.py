'''Deterministic legal-domain classification used for lawyer matching.'''
import re
import unicodedata

CATEGORIES: dict[str, list[str]] = {
    'Đất đai': ['dat dai', 'quyen su dung dat', 'so do', 'giay chung nhan', 'tranh chap dat'],
    'Hôn nhân và Gia đình': ['ly hon', 'hon nhan', 'chia tai san', 'nuoi con', 'cap duong'],
    'Hình sự': ['hinh su', 'bi can', 'bi cao', 'khoi to', 'bat tam giam', 'to tung hinh su'],
    'Doanh nghiệp': ['doanh nghiep', 'cong ty', 'thuong mai', 'co dong', 'gop von', 'hop dong kinh doanh'],
    'Lao động': ['lao dong', 'sa thai', 'bao hiem xa hoi', 'bhxh', 'hop dong lao dong', 'tien luong'],
    'Dân sự': ['dan su', 'thua ke', 'boi thuong', 'vay no', 'hop dong dan su', 'tai san'],
    'Hành chính': ['hanh chinh', 'khieu nai', 'to cao', 'quyet dinh hanh chinh', 'xu phat'],
    'Thuế': ['thue', 'hoa don', 'quyet toan', 'ma so thue'],
}


def _normalize(text: str) -> str:
    value = unicodedata.normalize('NFD', (text or '').lower())
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
    text = _normalize(' '.join([question, fallback_from_doc or '', web_hint or '']))
    best_label = 'Tổng quát'
    best_hits = 0
    for label, keywords in CATEGORIES.items():
        hits = sum(1 for keyword in keywords if keyword in text)
        if hits > best_hits:
            best_label, best_hits = label, hits

    if best_hits:
        return best_label
    return canonicalize_specialization(fallback_from_doc) or canonicalize_specialization(web_hint) or 'Tổng quát'
