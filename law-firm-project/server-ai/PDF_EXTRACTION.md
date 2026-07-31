# Trích xuất PDF thật

AI service dùng `pypdf` để đọc text trực tiếp từ PDF. Nội dung được chuẩn hóa
Unicode, loại ký tự NUL/khoảng trắng dư và gắn `[Trang N]` trước từng trang để
phục vụ truy vết nguồn trong RAG.

## Cài đặt

```bash
pip install -r requirements-pdf.txt
```

## Cấu hình

```env
PDF_MAX_SIZE_MB=25
PDF_MAX_PAGES=500
PDF_MAX_EXTRACTED_CHARACTERS=2000000
PDF_STRICT_MODE=false
```

- `PDF_STRICT_MODE=false`: bỏ qua PDF lỗi và tiếp tục nạp các tài liệu còn lại.
- `PDF_STRICT_MODE=true`: dừng quá trình nạp khi gặp PDF lỗi.

## Giới hạn

`pypdf` chỉ trích xuất lớp text có sẵn trong PDF. PDF scan chỉ chứa ảnh sẽ bị
từ chối với thông báo cần OCR; hệ thống không giả lập nội dung và không đưa PDF
scan rỗng vào vector index.

File mã hóa bằng mật khẩu, file không có header `%PDF-`, file vượt giới hạn và
file không có text đều bị từ chối.

Sau khi đặt PDF thật cùng file metadata vào `app/data`, gọi CRUD tài liệu hoặc
khởi động lại AI service. Vector retriever sẽ chunk nội dung đã trích xuất và
tạo embedding cho các chunk mới.
