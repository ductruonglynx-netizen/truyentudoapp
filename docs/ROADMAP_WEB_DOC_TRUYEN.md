# Roadmap Phát Triển Web Đọc Truyện

## 1) Mục tiêu sản phẩm
- Biến TruyenForge thành một web đọc truyện dễ dùng như các trang truyện phổ biến.
- Ưu tiên trải nghiệm đọc ổn định, điều hướng mượt, dữ liệu không mất.
- Tách rõ hai luồng: `Truyện của bạn` và `Truyện công khai`.

## 2) Nguyên tắc triển khai
- Làm phần nào xong phần đó, có test và đo hiệu năng trước khi mở rộng.
- Mọi tính năng đọc phải ưu tiên mobile trước.
- Dữ liệu người dùng phải gắn theo tài khoản, không phụ thuộc thiết bị.

## 3) Kế hoạch theo giai đoạn

### Giai đoạn A - Nền tảng đọc truyện chuẩn (ưu tiên cao)
- [ ] Trang chủ có các khối: `Mới cập nhật`, `Đang hot`, `Hoàn thành`, `Đề cử`.
- [ ] Card truyện chuẩn: ảnh bìa, tên truyện, thể loại, số chương, trạng thái, thời gian cập nhật.
- [ ] Trang chi tiết truyện đầy đủ: giới thiệu, tác giả, thể loại, trạng thái, mục lục chương.
- [ ] Mục lục hỗ trợ tìm nhanh theo từ khóa/chương.
- [ ] Reader có nút `Chương trước / Chương sau / Quay lại mục lục`.
- [ ] Reader lưu vị trí đọc gần nhất theo tài khoản.
- [ ] Reader lưu cài đặt đọc: font, cỡ chữ, line-height, nền, chiều rộng khung đọc.

### Giai đoạn B - Tính năng người dùng phổ thông
- [ ] Theo dõi truyện.
- [ ] Lịch sử đọc truyện/chương.
- [ ] Đánh dấu chương đã đọc.
- [ ] Tìm kiếm nâng cao: tên truyện, tác giả, thể loại, trạng thái.
- [ ] Khu `Truyện công khai` có lọc theo thể loại và sắp xếp.
- [ ] Hồ sơ người dùng: avatar, truyện đã theo dõi, truyện đã đăng.

### Giai đoạn C - Tương tác cộng đồng
- [ ] Bình luận theo chương.
- [ ] Báo lỗi nội dung (report) và ẩn bình luận vi phạm.
- [ ] Truyện liên quan theo tag/thể loại.
- [ ] Gợi ý cá nhân hóa dựa trên lịch sử đọc.

### Giai đoạn D - Tối ưu vận hành và tăng trưởng
- [ ] SEO cơ bản: meta/title theo truyện-chương, sitemap, canonical.
- [ ] Tối ưu tải trang: lazy load, cache API, giảm payload JSON.
- [ ] Theo dõi lỗi runtime + giám sát hiệu năng (web vitals).
- [ ] Chống spam/rate limit cho API nhạy cảm.
- [ ] Trang phản hồi người dùng và quy trình xử lý lỗi nhanh.

## 4) Việc cần chốt kỹ thuật sớm
- [ ] Chuẩn hóa schema truyện/chương để không lệch dữ liệu giữa các màn.
- [ ] Chuẩn hóa quyền đọc/sửa cho truyện `private/public`.
- [ ] Chuẩn hóa chiến lược sync: chỉ sync khi có thao tác lưu dữ liệu.
- [ ] Thiết kế migration dữ liệu an toàn (không mất truyện cũ).

## 5) KPI theo dõi tiến độ
- [ ] Tỉ lệ lỗi khi đọc chương < 1%.
- [ ] Tỉ lệ mất vị trí đọc = 0.
- [ ] Tỉ lệ mất dữ liệu người dùng = 0.
- [ ] Thời gian mở trang đọc đầu tiên < 2.5s (mạng trung bình).
- [ ] Tỉ lệ người dùng quay lại đọc trong 7 ngày tăng theo từng phiên bản.

## 6) Mốc phiên bản đề xuất
- `0.2.x`: Hoàn thành Giai đoạn A.
- `0.3.x`: Hoàn thành Giai đoạn B.
- `0.4.x`: Hoàn thành Giai đoạn C.
- `0.5.x`: Hoàn thành Giai đoạn D.

