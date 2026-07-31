# Gemini Embedding và vector search

AI service sử dụng `gemini-embedding-001` để tạo vector cho chunk tài liệu và
câu hỏi. Tài liệu dùng task type `RETRIEVAL_DOCUMENT`; câu hỏi dùng
`RETRIEVAL_QUERY`. Các chunk được xếp hạng bằng Cosine Similarity.

## Biến môi trường

```env
GEMINI_API_KEY=your-key
EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSIONS=768
VECTOR_SIMILARITY_THRESHOLD=0.5
RETRIEVAL_TOP_K=3
EMBEDDING_CHUNK_SIZE=1200
EMBEDDING_CHUNK_OVERLAP=200
EMBEDDING_BATCH_SIZE=16
VECTOR_CACHE_PATH=app/data/.embedding_cache.json
```

`VECTOR_CACHE_PATH` là tùy chọn. Cache dùng fingerprint SHA-256 gồm model, số
chiều, mã tài liệu và nội dung chunk. Khi nội dung thay đổi, chỉ chunk thay đổi
được tạo embedding lại.

## Chế độ fallback

Khi không có `GEMINI_API_KEY` hoặc API embedding lỗi, hệ thống dùng bộ truy xuất
từ khóa cục bộ. Response tư vấn luôn cho biết chế độ thực tế:

```json
{
  "retrieval_backend": "gemini_vector",
  "embedding_model": "gemini-embedding-001",
  "matched_chunk_count": 3
}
```

Các giá trị `retrieval_backend`:

- `gemini_vector`: semantic vector search thật.
- `keyword_fallback`: truy xuất từ khóa, không phải semantic search.
- `none`: không có câu hỏi hoặc kho tài liệu rỗng.

## Khởi tạo index

Index được tạo lười ở truy vấn đầu tiên. Lần đầu có thể chậm vì phải gọi Gemini
cho các chunk chưa có cache. CRUD tài liệu gọi `reload()`; vector của chunk
không đổi được tái sử dụng từ cache.

## Kiểm thử

```bash
python -m unittest discover -s tests -v
```
