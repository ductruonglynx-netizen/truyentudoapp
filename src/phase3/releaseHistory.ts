export interface ReleaseNote {
  version: string;
  dateLabel: string;
  title: string;
  items: string[];
}

export const CURRENT_WRITER_VERSION = '0.0a';

export const WRITER_RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '0.0a',
    dateLabel: '2026-03-26',
    title: 'Tăng độ bám context cho Writer Pro',
    items: [
      'Nâng cấp prompt Writer Pro để bám chặt objective, timeline, glossary và Universe Wiki trước khi sinh nội dung.',
      'Tự động khóa glossary sau khi AI trả về, giảm tình trạng tên riêng và thuật ngữ bị trôi lại về bản gốc.',
      'Bổ sung Context Readiness để cảnh báo khi dữ liệu đầu vào còn thiếu, giúp AI hoạt động ổn định hơn.',
      'Cải thiện tạo ảnh bìa: tự dựng prompt hình ảnh tốt hơn và fallback bìa dự phòng rõ bố cục hơn khi dịch vụ ảnh AI bị lỗi.',
      'Cải thiện dịch truyện: giữ ngữ cảnh giữa các đoạn và siết lại từ điển tên riêng sau khi AI trả kết quả.',
      'Khắc phục 2 mục trong Writer Pro: tab Tone và Context giờ cập nhật đúng runtime/context, đồng thời cho phép đẩy kết quả về workspace nhanh hơn.',
      'Thêm mục Lịch sử cập nhật nhỏ ngay trong giao diện để theo dõi thay đổi của sản phẩm.',
    ],
  },
];
