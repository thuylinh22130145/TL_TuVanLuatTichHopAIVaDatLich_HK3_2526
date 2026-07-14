"""
Web Search Fallback giả lập — khi RAG nội bộ độ tương đồng thấp.
Production: tích hợp Tavily, SerpAPI, hoặc Bing Search.
"""
from dataclasses import dataclass


@dataclass
class WebSearchSnippet:
    title: str
    url: str
    snippet: str
    specialization_hint: str


# Kết quả tìm kiếm giả lập theo chủ đề
_MOCK_WEB_RESULTS: dict[str, list[WebSearchSnippet]] = {
    "đất": [
        WebSearchSnippet(
            title="Thủ tục cấp Giấy chứng nhận quyền sử dụng đất",
            url="https://mock.gov.vn/dat-dai-gcn",
            snippet=(
                "Người sử dụng đất nộp hồ sơ tại Văn phòng đăng ký đất đai. "
                "Luật Đất đai 2024 quy định thời hạn, loại đất và hạn mức giao đất."
            ),
            specialization_hint="Đất đai",
        ),
    ],
    "ly hon": [
        WebSearchSnippet(
            title="Thủ tục ly hôn tại Tòa án nhân dân",
            url="https://mock.gov.vn/ly-hon",
            snippet="Ly hôn đơn phương khi vợ chồng không thống nhất được giải quyết tại Tòa.",
            specialization_hint="Hôn nhân gia đình",
        ),
    ],
    "hinh su": [
        WebSearchSnippet(
            title="Quyền của bị can trong tố tụng hình sự",
            url="https://mock.gov.vn/hinh-su",
            snippet="Bị can có quyền có luật sư, được biết kết quả điều tra theo BLTTHS.",
            specialization_hint="Hình sự",
        ),
    ],
    "default": [
        WebSearchSnippet(
            title="Cổng thông tin pháp luật quốc gia",
            url="https://mock.gov.vn/phap-luat",
            snippet=(
                "Tra cứu văn bản pháp luật Việt Nam theo lĩnh vực. "
                "Khuyến nghị đối chiếu văn bản gốc và tư vấn luật sư."
            ),
            specialization_hint="Tổng quát",
        ),
    ],
}


def _normalize_key(text: str) -> str:
    import unicodedata
    import re

    t = text.lower()
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", t)


def mock_web_search(query: str) -> list[WebSearchSnippet]:
    """Giả lập tìm kiếm Internet theo từ khóa trong câu hỏi."""
    key = _normalize_key(query)

    if any(k in key for k in ("dat dai", "dat", "thua ke dat", "quyen su dung dat")):
        return _MOCK_WEB_RESULTS["đất"]
    if any(k in key for k in ("ly hon", "hon nhan", "chia tai san")):
        return _MOCK_WEB_RESULTS["ly hon"]
    if any(k in key for k in ("hinh su", "bi can", "khoi to")):
        return _MOCK_WEB_RESULTS["hinh su"]

    return _MOCK_WEB_RESULTS["default"]


def build_web_context(snippets: list[WebSearchSnippet]) -> str:
    parts = []
    for i, s in enumerate(snippets, 1):
        parts.append(f"[Nguồn web {i}] {s.title}\n{s.snippet}\n({s.url})")
    return "\n\n".join(parts)
