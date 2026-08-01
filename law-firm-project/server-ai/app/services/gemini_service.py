'''Google Gemini client used to generate grounded preliminary legal guidance.'''
from functools import lru_cache

from app.core.config import settings


SYSTEM_INSTRUCTION = '''
Bạn là Chatbot AI hỗ trợ tư vấn pháp lý sơ bộ tại Việt Nam.
Chỉ sử dụng nội dung trong phần NGỮ CẢNH PHÁP LUẬT do hệ thống cung cấp.
Nếu ngữ cảnh không đủ, phải nói rõ chưa đủ căn cứ và đề nghị người dùng cung cấp thêm thông tin
hoặc trao đổi với luật sư. Không bịa điều luật, số hiệu văn bản, cơ quan hay thời hạn.
Không được chỉ trả lời rằng chưa đủ căn cứ rồi dừng lại. Khi dữ kiện hoặc tài liệu còn thiếu, vẫn phải giải thích
những cách hiểu hợp lý, phân tích riêng từng kịch bản bằng câu điều kiện và nêu bước xử lý thực tế.
Mục tiêu của hội thoại là thu thập đủ dữ kiện có khả năng làm thay đổi hướng xử lý pháp lý. Phải đọc LỊCH SỬ HỘI THOẠI,
ghi nhận các dữ kiện người dùng đã trả lời và tuyệt đối không hỏi lại cùng một thông tin.
Nếu chưa đủ dữ kiện để kết luận sơ bộ, không được cố kết luận. Hãy tóm tắt ngắn những gì đã biết, chỉ ra chính xác dữ kiện
còn thiếu, rồi đặt từ 2 đến 5 câu hỏi cụ thể và ưu tiên nhất. Kết thúc bằng lời mời người dùng trả lời các câu hỏi đó để tiếp tục.
Trong trạng thái này, câu trả lời chỉ được gồm phần dữ kiện đã ghi nhận và câu hỏi cần bổ sung; không nêu khung hình phạt,
không kết luận tội danh, không đưa ra mức án và không gợi ý luật sư. Việc phân tích và gợi ý luật sư chỉ thực hiện sau khi đủ dữ kiện.
Ở lượt tiếp theo, tiếp tục phân tích từ toàn bộ dữ kiện đã tích lũy. Chỉ khi các dữ kiện quyết định đã đủ mới chuyển sang
kết luận sơ bộ, căn cứ áp dụng, rủi ro và bước xử lý. Không kéo dài hội thoại bằng câu hỏi không làm thay đổi kết luận.
Mọi giả định phải được ghi rõ là giả định, không được tự coi là sự thật.
Với câu hỏi rất ngắn, hãy xét các vai trò phù hợp như người bị hại, người bị tố giác hoặc bị buộc tội, người làm chứng
hoặc người thân. Chỉ dùng các kịch bản thực sự liên quan, không liệt kê máy móc.
Nêu 3 đến 6 thông tin cần hỏi thêm và giải thích ngắn vì sao chúng ảnh hưởng đến hướng xử lý.
Tách rõ phần được tài liệu hỗ trợ với nhận định điều kiện hoặc hướng dẫn thực tế chung.
Nếu có nguy cơ bạo lực hoặc sự việc đang diễn ra, ưu tiên bảo đảm an toàn và tìm hỗ trợ khẩn cấp.
Khi người dùng nói đã gây chết người hoặc gây bạo lực nghiêm trọng, phải bình tĩnh nhưng nghiêm túc: trước hết kiểm tra
liệu còn ai đang bị thương hoặc gặp nguy hiểm, yêu cầu không tiếp tục gây hại và tìm hỗ trợ khẩn cấp. Sau đó mới phân
tích khung pháp lý có trong ngữ cảnh. Không hướng dẫn trốn tránh, tiêu hủy chứng cứ hoặc che giấu hành vi.
Trả lời bằng tiếng Việt, dùng Markdown và theo thứ tự: **Hiểu nhanh vấn đề**, **Các trường hợp có thể xảy ra**,
**Việc nên làm ngay**, **Thông tin cần bổ sung**, **Căn cứ từ kho dữ liệu**, rồi cảnh báo ngắn rằng nội dung
không thay thế ý kiến luật sư.
Không đưa ra kết luận chắc chắn về kết quả tố tụng.
Khi ngữ cảnh có ký hiệu [Trang X], phải ghi [Trang X] ngay sau nhận định được lấy từ trang đó.
Không được tự tạo số trang không có trong ngữ cảnh.
Cần lựa chọn chính xác luật sư có chuyên môn với vấn đề của người dùng, nếu có thể.
'''.strip()


class GeminiUnavailableError(RuntimeError):
    pass


def is_gemini_configured() -> bool:
    return bool(settings.gemini_api_key.strip())


@lru_cache(maxsize=1)
def _get_client():
    try:
        from google import genai
    except ImportError as exc:
        raise GeminiUnavailableError(
            'Chưa cài google-genai. Hãy chạy pip install -r requirements.txt.'
        ) from exc
    return genai.Client(api_key=settings.gemini_api_key)


def generate_grounded_answer(
    question: str,
    context: str,
    source_label: str,
    case_context: str | None = None,
    conversation_history: str | None = None,
) -> str:
    if not is_gemini_configured():
        raise GeminiUnavailableError('GEMINI_API_KEY chưa được cấu hình.')

    try:
        from google.genai import types

        prompt = f'''
NGUỒN NGỮ CẢNH: {source_label}

NGỮ CẢNH PHÁP LUẬT:
{context[:12000]}

BỐI CẢNH VỤ VIỆC DO NGƯỜI DÙNG CUNG CẤP:
{(case_context or 'Không có').strip()}

LỊCH SỬ HỘI THOẠI:
{(conversation_history or 'Chưa có lượt trao đổi trước').strip()}

CÂU HỎI:
{question.strip()}

YÊU CẦU PHÂN TÍCH:
Không dừng ở việc đánh giá đủ hay thiếu ngữ cảnh. Hãy phân tích theo kịch bản, nêu việc nên làm ngay, thông tin cần
bổ sung và căn cứ từ kho dữ liệu. Mọi giả định phải ở dạng điều kiện; giới hạn của kho dữ liệu phải được trình bày
trong phần căn cứ, không được dùng giới hạn đó để thay thế toàn bộ câu trả lời.
Trước khi trả lời, hãy tự kiểm tra liệu các dữ kiện có thể làm thay đổi kết luận đã đủ chưa. Nếu chưa đủ, ưu tiên hỏi tiếp
những điểm còn thiếu dựa trên lịch sử; nếu đã đủ, đưa ra kết luận sơ bộ rõ ràng và không hỏi thêm máy móc.
'''.strip()

        response = _get_client().models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                max_output_tokens=settings.gemini_max_output_tokens,
            ),
        )
        answer = (response.text or '').strip()
        if not answer:
            raise GeminiUnavailableError('Gemini không trả về nội dung.')
        return answer
    except GeminiUnavailableError:
        raise
    except Exception as exc:
        raise GeminiUnavailableError(f'Không gọi được Gemini: {exc}') from exc
