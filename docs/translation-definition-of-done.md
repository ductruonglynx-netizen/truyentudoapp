# Translation Definition of Done (DoD)

## 1) Pipeline bắt buộc
- Có đủ 4 pha: `Parse -> Translate -> QA -> Export`.
- Không được xuất bản nếu QA gate chưa pass.
- Mỗi chunk phải có trạng thái rõ: `pending/success/fail/retry`.

## 2) Gate chặn trước khi lưu
- Không còn lỗi thứ tự chương.
- Không có chương rỗng hoặc quá ngắn bất thường.
- Không còn ký tự CJK vượt ngưỡng cho phép.
- Không còn dòng trộn tiếng Việt + tiếng Trung bất thường.

## 3) Chất lượng dịch
- Dùng glossary theo từng truyện, không dùng chéo giữa truyện.
- Hậu kiểm local rule-first trước khi gọi AI sửa hậu kỳ.
- Tên riêng và thuật ngữ phải giữ nhất quán toàn bộ chương đã dịch.

## 4) Ổn định vận hành
- Có retry theo loại lỗi (timeout, 429/503, quá tải model).
- Có adaptive backoff (giảm concurrency, giảm batch size, tăng delay).
- Có checkpoint định kỳ để resume khi lỗi giữa chừng.

## 5) Quan sát và debug
- Log theo chunk: model, latency, retry count, trạng thái.
- UI hiển thị tiến độ: đã xử lý X/Y, ETA, trạng thái recovering/degrade.
- Mã lỗi rõ ràng cho người dùng cuối.

## 6) Trước release
- Chạy bộ regression với nhiều file thật (ngắn, dài, có/không chia chương rõ).
- Không còn lỗi blocker (P0/P1).
- Có rollback plan và feature flag cho các thay đổi lớn.

## 7) Sau release
- Theo dõi 24-48h: tỷ lệ fail/retry, thời gian dịch trung bình, cảnh báo QA gate.
- Nếu lỗi tăng vượt ngưỡng, tự động hạ cấu hình và bật chế độ an toàn file lớn.
