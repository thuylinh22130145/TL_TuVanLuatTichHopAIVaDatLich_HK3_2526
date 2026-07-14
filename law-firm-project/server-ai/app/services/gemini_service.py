'''Google Gemini client used to generate grounded preliminary legal guidance.'''
from functools import lru_cache

from app.core.config import settings


SYSTEM_INSTRUCTION = '''
Bạn là AI Assistant hỗ trợ tư vấn pháp lý sơ bộ tại Việt Nam.
Chỉ sử dụng nội dung trong phần NGỮ CẢNH PHÁP LUẬT do hệ thống cung cấp.
Nếu ngữ cảnh không đủ, phải nói rõ chưa đủ căn cứ và đề nghị người dùng cung cấp thêm thông tin
hoặc trao đổi với luật sư. Không bịa điều luật, số hiệu văn bản, cơ quan hay thời hạn.
Trả lời bằng tiếng Việt, rõ ràng, có cấu trúc ngắn gọn gồm: nhận định sơ bộ, căn cứ/ngữ cảnh
được sử dụng, bước người dùng nên làm tiếp theo, và cảnh báo rằng nội dung không thay thế ý kiến luật sư.
Không đưa ra kết luận chắc chắn về kết quả tố tụng.
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

CÂU HỎI:
{question.strip()}
'''.strip()

        response = _get_client().models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=settings.gemini_temperature,
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
