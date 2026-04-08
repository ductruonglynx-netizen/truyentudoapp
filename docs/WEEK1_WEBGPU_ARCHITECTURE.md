# Week 1 WebGPU Architecture

## Mục tiêu tuần 1
- Chốt phạm vi dùng WebGPU trong bản đầu.
- Thiết kế cơ chế bật/tắt bằng feature flag.
- Thiết lập KPI đo hiệu năng và độ ổn định.
- Có smoke test để phát hiện lỗi adapter/device sớm.

## Phạm vi kỹ thuật
- UI theo dõi tiến độ + chạy check ở `Tools > WebGPU Tuần 1`.
- Module runtime: `src/webgpu/weekOne.ts`.
- Biến môi trường:
  - `VITE_ENABLE_WEBGPU`
  - `VITE_WEBGPU_STABILITY_ITERATIONS`

## Luồng chạy capability check
1. Kiểm tra feature flag.
2. Kiểm tra secure context (HTTPS/localhost).
3. Kiểm tra `navigator.gpu`.
4. Request adapter và đọc info/limits.
5. Ghi report vào local state để audit nhanh.

## Luồng chạy stability smoke
1. Dùng adapter/device hiện tại.
2. Chạy lặp copy buffer trên queue GPU.
3. Chờ queue idle từng vòng.
4. Đọc ngược dữ liệu để xác nhận integrity.
5. Trả report gồm pass/fail, iterations, throughput, avg latency.

## KPI tuần 1 đề xuất
- Capability check pass trên môi trường dev mục tiêu.
- Stability smoke hoàn tất đủ số vòng cấu hình.
- Không có lỗi device lost trong smoke.
- Task progress đạt 100% trước khi sang tuần 2.

## Gate sang tuần 2
- Hoàn tất 4 task tuần 1 ở trạng thái `done`.
- Lint + build pass.
- E2E smoke pass trên Chromium.
