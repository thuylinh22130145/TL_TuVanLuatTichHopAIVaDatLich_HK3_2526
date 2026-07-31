# Socket.IO realtime

Hệ thống dùng Socket.IO để cập nhật màn hình lịch tư vấn ngay khi một lịch được
tạo, sửa trạng thái, hủy hoặc xóa.

## Luồng sự kiện

1. Client đăng nhập và kết nối Socket.IO bằng access token JWT.
2. Server xác thực token và đưa socket vào các phòng phù hợp:
   - `role:ADMIN`
   - `lawyer:{lawyerId}`
   - `user:{userId}`
3. Sequelize phát hook sau khi bản ghi `Booking` được tạo, cập nhật hoặc xóa.
4. Server gửi sự kiện `booking:changed` cho Admin, luật sư phụ trách và khách
   hàng sở hữu lịch.
5. Giao diện nạp lại dữ liệu từ REST API để luôn nhận bản ghi đầy đủ và đã được
   kiểm tra quyền.

Payload sự kiện chỉ chứa mã định danh và trạng thái, không chứa nội dung tư vấn
hay thông tin liên hệ của khách hàng.

## Cấu hình

Socket.IO dùng cùng cổng với Express, mặc định:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
```

`VITE_SOCKET_URL` là tùy chọn. Nếu không khai báo, client tự lấy origin từ
`VITE_API_BASE_URL`.

Có thể cho phép nhiều frontend origin bằng danh sách phân cách dấu phẩy:

```env
CORS_ORIGIN=http://localhost:5173,https://example.com
```

## Chạy

Các lệnh cũ không thay đổi:

```bash
cd server-api
npm run dev
```

```bash
cd client-app
npm run dev
```

`package.json` đã trỏ đến `server-realtime.js` và `vite.socket.config.js`.
