# Hướng dẫn chạy hệ thống (không mock — trừ câu trả lời AI)

## Kiến trúc

```
client-app (:5173)  →  server-api (:3000) + MySQL
                            ↓
                       server-ai (:8000) + app/data (RAG thật)
                            ↓
                       mock_llm.py  ← DUY NHẤT phần dummy
```

| Thành phần | Thật / Dummy |
|------------|----------------|
| React UI, đăng nhập, CRUD | **Thật** (server-api + MySQL) |
| Đặt lịch, luật sư, tài liệu | **Thật** |
| RAG tra cứu văn bản `app/data` | **Thật** |
| Sinh câu trả lời chat (`mock_llm`) | **Dummy** |

## Biến môi trường

`API_KEY` trên server-ai = `AI_SERVICE_API_KEY` trên server-api.

## Khởi động

```bash
# 1 — AI (bắt buộc cho chat + tài liệu)
cd server-ai && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2 — API + MySQL
cd server-api && npm install && npm run db:seed && npm run dev

# 3 — Frontend
cd client-app && npm install && npm run dev
```

Tạo DB: `CREATE DATABASE law_firm_db ...` (xem `server-api/sql/schema.sql`).

Đăng nhập admin (seed): **admin** / **admin123**

## API client → server-api

| Chức năng | Endpoint |
|-----------|----------|
| Luật sư (khách) | GET `/api/public/lawyers` |
| Đặt lịch (khách) | POST `/api/public/bookings` |
| Chat AI | POST `/api/public/chat` |
| Admin login | POST `/api/admin/auth/login` |
| CRUD luật sư / lịch / tài liệu | `/api/admin/...` |

Chat: server-api → `POST server-ai/api/v1/predict-consultation`
