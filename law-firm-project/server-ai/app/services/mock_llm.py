'''Local fallback used when Gemini is not configured or temporarily unavailable.'''


def generate_answer(question: str, context: str, source_label: str, doc_specialization: str | None = None) -> str:
    context_preview = context[:1400] + ('...' if len(context) > 1400 else '')
    domain = f' Lĩnh vực có thể liên quan: {doc_specialization}.' if doc_specialization else ''
    return (
        f'Hệ thống chưa kết nối được Gemini.{domain}\n\n'
        f'Thông tin tham chiếu nội bộ tìm được:\n{context_preview}\n\n'
        'Bạn nên cung cấp thêm thời gian, địa điểm, chủ thể và tài liệu liên quan để việc phân tích chính xác hơn. '
        'Nội dung này chỉ mang tính tham khảo và không thay thế ý kiến của luật sư.'
    )
