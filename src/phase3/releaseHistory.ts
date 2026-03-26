import { APP_VERSION_LABEL } from '../version';

export interface ReleaseNote {
  version: string;
  dateLabel: string;
  title: string;
  items: string[];
}

export const CURRENT_WRITER_VERSION = APP_VERSION_LABEL;

export const WRITER_RELEASE_NOTES: ReleaseNote[] = [
  {
    version: APP_VERSION_LABEL,
    dateLabel: '2026-03-26',
    title: 'Tăng độ bám context cho Writer Pro',
    items: [
      'Nâng cấp prompt Writer Pro để bám chặt objective, timeline, glossary và Universe Wiki trước khi sinh nội dung.',
      'Tự động khóa glossary sau khi AI trả về, giảm tình trạng tên riêng và thuật ngữ bị trôi lại về bản gốc.',
      'Bổ sung Context Readiness để cảnh báo khi dữ liệu đầu vào còn thiếu, giúp AI hoạt động ổn định hơn.',
      'Cải thiện tạo ảnh bìa: tự dựng prompt hình ảnh tốt hơn và fallback bìa dự phòng rõ bố cục hơn khi dịch vụ ảnh AI bị lỗi.',
      'Cải thiện dịch truyện: gom nhiều đoạn vào một lượt dịch, giữ ngữ cảnh giữa các lô và chỉ nạp từ điển tên riêng đúng phần đang xuất hiện để dịch nhanh và ổn định hơn.',
      'Bổ sung khả năng hủy tác vụ AI đang chạy, thay thông báo chặn bằng toast nhẹ hơn để các nút dịch/viết/tạo truyện phản hồi rõ ràng hơn.',
      'Sửa Kho Prompt để Lưu thay đổi ghi bền vào local storage, đồng thời các nút trong trang Công cụ giờ đã có hành vi thực tế thay vì chỉ là placeholder.',
      'Siết an toàn backup/import: loại secret khỏi file sao lưu, validate dữ liệu khi nhập và lưu sẵn một bản backup an toàn trước khi khôi phục.',
      'Khắc phục 2 mục trong Writer Pro: tab Tone và Context giờ cập nhật đúng runtime/context, đồng thời cho phép đẩy kết quả về workspace nhanh hơn.',
      'Thêm mục Lịch sử cập nhật nhỏ ngay trong giao diện để theo dõi thay đổi của sản phẩm.',
    ],
  },
];
