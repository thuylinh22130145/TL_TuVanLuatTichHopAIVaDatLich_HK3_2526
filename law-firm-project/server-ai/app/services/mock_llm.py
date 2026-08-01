'''Local fallback used when Gemini is not configured or temporarily unavailable.'''


def _is_robbery_question(question: str) -> bool:
    normalized = question.lower()
    return 'cướp' in normalized and 'cướp giật' not in normalized


def _scenario_section(specialization: str | None, question: str = '') -> str:
    if specialization == 'Hình sự' and _is_robbery_question(question):
        return (
            '- **Khung cơ bản:** nếu có hành vi dùng vũ lực, đe dọa dùng vũ lực ngay tức khắc hoặc làm nạn nhân không thể chống cự nhằm chiếm đoạt tài sản, hành vi có thể được xem xét theo Điều 168.\n'
            '- **Khung tăng nặng:** giá trị vàng, việc sử dụng vũ khí, có đồng phạm hoặc tổ chức, thương tích, chết người và tái phạm có thể làm thay đổi mạnh khung hình phạt.\n'
            '- **Có thể là tội danh khác:** nếu diễn biến thực tế không có đặc điểm của hành vi cướp nêu trên, cơ quan tố tụng phải xác định lại theo cách thức chiếm đoạt thực tế.'
        )
    if specialization == 'Hình sự':
        return (
            '- **Nếu bạn là người bị hại:** ưu tiên bảo đảm an toàn, ghi lại diễn biến, đặc điểm nhận dạng, '
            'thiệt hại và bảo quản video, hình ảnh, tin nhắn hoặc thông tin nhân chứng.\n'
            '- **Nếu bạn là người bị tố giác hoặc bị buộc tội:** không tự ý sửa, xóa tài liệu liên quan; ghi lại '
            'quá trình làm việc và trao đổi sớm với luật sư hình sự để được hướng dẫn theo đúng vai trò tố tụng.\n'
            '- **Nếu bạn là người làm chứng hoặc người thân:** ghi nhận điều mình trực tiếp biết, tránh suy đoán '
            'hoặc lan truyền thông tin chưa kiểm chứng và chuẩn bị thông tin liên hệ khi cần làm rõ.'
        )
    return (
        '- **Nếu sự việc mới phát sinh:** lưu lại mốc thời gian, người liên quan và tài liệu hiện có.\n'
        '- **Nếu đã có tranh chấp hoặc yêu cầu:** bảo quản văn bản đã nhận và ghi lại thời hạn được nêu trong văn bản.\n'
        '- **Nếu đang cân nhắc hành động tiếp theo:** chuẩn bị mục tiêu cần giải quyết và trao đổi với luật sư '
        'đúng chuyên môn trước quyết định khó hoàn tác.'
    )


def _legal_overview(question: str, context: str, specialization: str | None) -> str:
    if specialization == 'Hình sự' and _is_robbery_question(question) and 'Điều 168' in context and '03 năm đến 10 năm' in context:
        return (
            'Theo Điều 168 trong tài liệu truy xuất, khung cơ bản của tội cướp tài sản là **03 năm đến 10 năm tù**. '
            'Các khung tăng nặng có thể là **07 năm đến 15 năm**, **12 năm đến 20 năm**, hoặc **18 năm đến 20 năm hay tù chung thân**, '
            'tùy giá trị tài sản, vũ khí hoặc thủ đoạn, thương tích, chết người, đồng phạm có tổ chức và các tình tiết khác. '
            'Chỉ riêng thông tin cướp tiệm vàng chưa đủ để chọn một khung cụ thể.'
        )
    if specialization == 'Hình sự' and 'giết' in question.lower() and 'Điều 123' in context and '12 năm đến 20 năm' in context:
        return (
            'Nếu lời mô tả được chứng minh là hành vi cố ý giết từ 02 người trở lên, điểm a khoản 1 Điều 123 trong '
            'tài liệu truy xuất cho biết khung cần xem xét là **12 năm đến 20 năm tù, tù chung thân hoặc tử hình**. '
            'Đây là khung có thể áp dụng, không phải kết luận về mức án cụ thể; Tòa án còn phải làm rõ tuổi, lỗi, '
            'vai trò, chứng cứ, nhân thân và các tình tiết của vụ án.'
        )
    domain = specialization or 'Tổng quát'
    return (
        f'Câu hỏi {question.strip()} có thể liên quan đến lĩnh vực **{domain}**, '
        'nhưng chưa cho biết đầy đủ vai trò và tình trạng hiện tại của sự việc.'
    )


def generate_answer(question: str, context: str, source_label: str, doc_specialization: str | None = None) -> str:
    is_robbery = doc_specialization == 'Hình sự' and _is_robbery_question(question)
    follow_up = (
        '- Tổng giá trị vàng hoặc tài sản thực tế là bao nhiêu?\n'
        '- Có dùng vũ khí, đe dọa dùng vũ lực ngay tức khắc hoặc hành hung ai không?\n'
        '- Có ai bị thương hoặc tử vong không; nếu bị thương thì kết quả giám định là bao nhiêu?\n'
        '- Bạn thực hiện một mình hay có người tổ chức, giúp sức hoặc cùng tham gia?\n'
        '- Bạn bao nhiêu tuổi và hiện đã bị bắt, triệu tập hay khởi tố chưa?'
        if is_robbery else
        '- Bạn tham gia sự việc với vai trò nào?\n'
        '- Sự việc xảy ra khi nào, ở đâu và hiện còn đang diễn ra không?\n'
        '- Có thiệt hại, thương tích, nhân chứng hoặc tài liệu nào?\n'
        '- Bạn đã làm việc với cơ quan hoặc tổ chức nào chưa?'
    )
    source_title = context.splitlines()[0].removeprefix('Tài liệu: ').strip() if context.strip() else 'Không xác định'
    return (
        f'## Hiểu nhanh vấn đề\n\n{_legal_overview(question, context, doc_specialization)}\n\n'
        f'## Các trường hợp có thể xảy ra\n\n{_scenario_section(doc_specialization, question)}\n\n'
        '## Việc nên làm ngay\n\n'
        '1. Nếu có nguy cơ mất an toàn, hãy rời khỏi nơi nguy hiểm và tìm hỗ trợ khẩn cấp.\n'
        '2. Giữ nguyên tài liệu, dữ liệu điện tử và ghi lại diễn biến theo trình tự thời gian.\n'
        '3. Chuẩn bị thông tin để trao đổi với luật sư đúng chuyên môn.\n\n'
        '## Thông tin cần bổ sung\n\n'
        f'{follow_up}\n\n'
        f'## Căn cứ từ kho dữ liệu\n\nNguồn truy xuất: `{source_label}` — **{source_title}**. '
        'Hệ thống chỉ dùng phần liên quan trong tài liệu để lập phân tích và không hiển thị đoạn trích thô bị cắt giữa câu.\n\n'
        '> Gemini hiện không khả dụng nên đây là hướng dẫn dự phòng, không thay thế ý kiến tư vấn của luật sư.'
    )
