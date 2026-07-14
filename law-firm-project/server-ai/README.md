# server-ai — FastAPI (RAG tư vấn luật)

Microservice Python xử lý **Retrieval-Augmented Generation** (mock) cho văn phòng luật.

## Cấu trúc

```
server-ai/
├── main.py                      # FastAPI app
├── app/
│   ├── api/v1/routes/           # predict-consultation
│   ├── core/                    # config, API key
│   ├── schemas/                 # Pydantic request/response
│   ├── services/
│   │   ├── document_loader.py   # Đọc txt/pdf cục bộ
│   │   ├── rag_retriever.py     # So khớp mock (thay LangChain)
│   │   ├── web_fallback.py      # Tìm kiếm web giả lập
│   │   ├── mock_llm.py          # Sinh câu trả lời
│   │   ├── specialization.py    # Nhãn chuyên môn
│   │   └── consultation_service.py
│   └── data/                    # Văn bản luật mẫu (.txt, .pdf)
├── requirements.txt
└── .env.example
```

## Endpoint chính

**POST** `/api/v1/predict-consultation`

Header: `X-API-Key: <API_KEY>`

Body:
```json
{ "message": "Tôi muốn ly hôn đơn phương...", "case_context": null }
```

Response:
```json
{
  "answer": "...",
  "source": "internal_rag",
  "detected_specialization": "Hôn nhân gia đình"
}
```

- `source`: `internal_rag` (độ tương đồng ≥ ngưỡng) hoặc `web_fallback`
- Ngưỡng mặc định: `RAG_SIMILARITY_THRESHOLD=0.35`

Alias: **POST** `/api/v1/consult` (tương thích `server-api`)

### Quản lý tài liệu luật (CRUD — API key)

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/v1/documents` | Danh sách tài liệu |
| GET | `/api/v1/documents/{doc_id}` | Chi tiết + nội dung |
| POST | `/api/v1/documents` | Thêm file `.txt` + `.meta.json` |
| PUT | `/api/v1/documents/{doc_id}` | Cập nhật title / chuyên môn / nội dung |
| DELETE | `/api/v1/documents/{doc_id}` | Xóa — tự `reload()` RAG |

Sau mỗi thay đổi, `MockRAGRetriever.reload()` nạp lại kho `app/data`.

## Luồng nghiệp vụ

```mermaid
flowchart TD
  Q[Câu hỏi] --> RAG[Mock RAG retriever]
  RAG -->|score >= threshold| INT[internal_rag + mock LLM]
  RAG -->|score < threshold| WEB[web_fallback mock]
  WEB --> LLM2[mock LLM]
  INT --> SPEC[detect_specialization]
  LLM2 --> SPEC
  SPEC --> OUT[JSON response]
```

## Chạy local

```bash
cd server-ai
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 8000
```

Kiểm tra: `GET http://localhost:8000/health`

## Dummy vs thật

- **Thật:** đọc/ghi `app/data`, RAG retriever, nhãn chuyên môn, web fallback (tra cứu mô phỏng nguồn ngoài).
- **Dummy:** `app/services/mock_llm.py` — ghép ngữ cảnh thành câu trả lời (thay OpenAI/Ollama khi gắn `LLM_API_KEY`).

## Mở rộng sau này

- Thay `MockRAGRetriever` bằng LangChain + Chroma/FAISS
- Thay `mock_llm` bằng OpenAI / Ollama
- Thay `mock_web_search` bằng Tavily / SerpAPI
- PDF thật: `pdfplumber` hoặc `PyPDF2`
