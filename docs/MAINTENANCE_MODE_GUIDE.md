# Hướng Dẫn Chế Độ Bảo Trì (Maintenance)

## 1) Mục tiêu
File này là mẫu dùng nhanh để bật/tắt bảo trì cho TruyenForge mà không cần nhớ lại biến môi trường.

## 2) Biến môi trường chính
- `VITE_MAINTENANCE_MODE_GLOBAL`: khóa toàn bộ web.
- `VITE_MAINTENANCE_MODE_READER`: chỉ khóa khu đọc.
- `VITE_MAINTENANCE_MODE_STUDIO`: chỉ khóa Studio.
- `VITE_MAINTENANCE_ETA`: thời gian dự kiến mở lại.
- `VITE_MAINTENANCE_NOTICE`: thông báo mặc định.
- `VITE_MAINTENANCE_NOTICE_GLOBAL`: thông báo riêng cho global.
- `VITE_MAINTENANCE_NOTICE_READER`: thông báo riêng cho reader.
- `VITE_MAINTENANCE_NOTICE_STUDIO`: thông báo riêng cho studio.

## 3) Mẫu copy-paste nhanh

### A. Khóa toàn bộ web
```env
VITE_MAINTENANCE_MODE_GLOBAL=1
VITE_MAINTENANCE_MODE_READER=0
VITE_MAINTENANCE_MODE_STUDIO=0
VITE_MAINTENANCE_ETA=2026-03-31T02:30:00+08:00
VITE_MAINTENANCE_NOTICE_GLOBAL=Hệ thống đang bảo trì toàn bộ để nâng cấp hiệu năng và sửa lỗi.
```

### B. Chỉ khóa khu đọc (Reader)
```env
VITE_MAINTENANCE_MODE_GLOBAL=0
VITE_MAINTENANCE_MODE_READER=1
VITE_MAINTENANCE_MODE_STUDIO=0
VITE_MAINTENANCE_ETA=2026-03-31T02:30:00+08:00
VITE_MAINTENANCE_NOTICE_READER=Khu đọc đang bảo trì để sửa lỗi hiển thị chương.
```

### C. Chỉ khóa Studio
```env
VITE_MAINTENANCE_MODE_GLOBAL=0
VITE_MAINTENANCE_MODE_READER=0
VITE_MAINTENANCE_MODE_STUDIO=1
VITE_MAINTENANCE_ETA=2026-03-31T02:30:00+08:00
VITE_MAINTENANCE_NOTICE_STUDIO=Studio đang bảo trì để nâng cấp công cụ viết và dịch.
```

### D. Mở lại toàn bộ
```env
VITE_MAINTENANCE_MODE_GLOBAL=0
VITE_MAINTENANCE_MODE_READER=0
VITE_MAINTENANCE_MODE_STUDIO=0
VITE_MAINTENANCE_ETA=
```

## 4) Quy trình thao tác trên Vercel
1. Vào `Project Settings -> Environment Variables`.
2. Sửa biến theo một mẫu ở mục 3.
3. Bấm Save.
4. Redeploy Production.

## 5) Lưu ý quan trọng
- `ETA` nên dùng chuẩn ISO có timezone để tránh lệch giờ:
  - Ví dụ tốt: `2026-03-31T02:30:00+08:00`
- App tự ghi nhận thời điểm bắt đầu bảo trì trên client để hiển thị.
- Khi tới ETA, app tự bỏ trạng thái bảo trì ở client.
- Nếu muốn mở ngay lập tức, đặt các biến `...MODE...=0` và redeploy.

