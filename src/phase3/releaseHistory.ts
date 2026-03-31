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
    dateLabel: '2026-03-31',
    title: 'Phiên bản 1.0 · Bản tổng hợp nâng cấp lớn về AI, dữ liệu và trải nghiệm',
    items: [
      'Nâng cấp toàn bộ pipeline dịch theo hướng an toàn cho file lớn: chia pha rõ ràng, có checkpoint, tự phục hồi khi quá tải và giữ mạch nhất quán giữa các chương.',
      'Tăng chuẩn chất lượng bản dịch trước khi lưu: tự phát hiện phần còn lẫn chữ Trung, dòng trộn ngôn ngữ, chương rỗng hoặc sai thứ tự; nếu chưa đạt thì không cho xuất bản.',
      'Bổ sung tự sửa hậu kỳ thông minh theo từng chương: hệ thống ưu tiên làm sạch các đoạn nghi lỗi trước khi trả kết quả để giảm khối lượng sửa tay.',
      'Chặn xuất TXT/EPUB khi bản dịch chưa sạch và hiển thị báo cáo PASS/FAIL rõ ràng ngay trong luồng dịch để người dùng biết chính xác lý do.',
      'Cải thiện khả năng dịch và viết tiếp truyện dài: giảm trả về dàn ý sai mục tiêu, tăng bám cốt truyện, bám xưng hô, bám thuật ngữ và continuity xuyên chương.',
      'Bổ sung cấu hình sinh văn bản chi tiết (temperature, top-p, top-k, max tokens, context, seed, thinking, streaming, auto-critique...) để người dùng tự tối ưu theo từng tác vụ.',
      'Nâng cấp hệ thống từ điển và translation memory theo từng bộ truyện, giúp tên riêng/thuật ngữ đã khóa ở truyện A tự giữ ổn định ở các chương sau mà không ảnh hưởng truyện B.',
      'Nâng cấp hệ thống sao lưu và khôi phục: có sao lưu ngay, lịch sử mốc, khôi phục theo thời điểm, xuất/nhập JSON và đồng bộ Drive theo một bản duy nhất để tránh rối dữ liệu.',
      'Củng cố đồng bộ tài khoản đa thiết bị: ưu tiên dữ liệu mới hơn, giảm ghi đè nhầm, tách dữ liệu theo tài khoản rõ ràng và ổn định hơn khi mạng không đều.',
      'Cải thiện luồng điều hướng đọc truyện như app thật: back theo đúng tầng Trang đọc -> Chi tiết truyện -> Trang chủ, giảm thoát nhầm ra ngoài.',
      'Tối ưu trải nghiệm đọc: cải thiện hiển thị đoạn thoại, thụt đầu dòng, bố cục đọc gần toàn màn hình, tinh chỉnh giao diện sáng/tối để chữ dễ nhìn hơn.',
      'Tinh gọn các khu vực thao tác dễ gây rối (đặc biệt khu sao lưu/cài đặt), làm nhãn rõ nghĩa hơn, giảm nút thừa và tăng phản hồi trạng thái cho người dùng phổ thông.',
      'Mở rộng hệ sinh thái AI provider/model, cho phép chọn model linh hoạt hơn theo mục đích (dịch, viết, phân tích, sinh ảnh), đồng thời tăng kiểm tra lỗi model không khả dụng.',
      'Nâng cấp lớp vận hành và an toàn phát hành: thêm checklist DoD cho pipeline dịch, tăng lớp quan sát lỗi và giảm nguy cơ tái phát lỗi cũ sau mỗi lần cập nhật.',
    ],
  },
  {
    version: '0.1e',
    dateLabel: '2026-03-29',
    title: 'Nâng cấp ổn định dữ liệu và đồng bộ nhiều thiết bị',
    items: [
      'Tăng độ ổn định khi làm việc với truyện dài: lưu dữ liệu an toàn hơn để giảm lỗi đầy bộ nhớ cục bộ khi thao tác liên tục.',
      'Cải thiện khôi phục dữ liệu khi có sự cố: app ưu tiên tìm mốc gần nhất để trả lại trạng thái làm việc nhanh hơn.',
      'Nâng đồng bộ tài khoản theo hướng ít ghi đè nhầm hơn khi dùng cùng một tài khoản trên nhiều thiết bị.',
      'Giảm nháy/giật trong các thao tác nền bằng cách làm mượt nhịp đồng bộ và giảm cập nhật dư thừa.',
      'Cải thiện hiển thị chương khi đọc: đoạn thoại và đoạn hệ thống được tách rõ hơn để dễ theo dõi.',
    ],
  },
  {
    version: '0.1d',
    dateLabel: '2026-03-29',
    title: 'Làm gọn trung tâm sao lưu và tăng khả năng phục hồi',
    items: [
      'Đơn giản hóa giao diện sao lưu theo phong cách tối giản, ưu tiên các nút thao tác chính để người dùng phổ thông dùng nhanh hơn.',
      'Tối ưu cơ chế sao lưu cục bộ để tránh lưu trùng và giảm nguy cơ phình dữ liệu không cần thiết.',
      'Tăng độ tin cậy khi khôi phục: nếu mốc cục bộ lỗi, hệ thống tự chuyển sang mốc gần nhất có thể dùng được.',
      'Cải thiện nhịp autosync theo hướng mượt hơn: khi có nhiều thay đổi liên tiếp, app gộp đợt để giảm rung lắc giao diện.',
    ],
  },
  {
    version: '0.1c',
    dateLabel: '2026-03-28',
    title: 'Đi lại điều hướng và URL cho trải nghiệm đọc liền mạch hơn',
    items: [
      'Chuẩn hóa URL theo kiểu dễ hiểu: Trang chủ `/`, trang truyện `/:storySlug`, trang đọc `/:storySlug/:chapterSlug`.',
      'Mỗi truyện có slug ID riêng để link ổn định hơn và hạn chế đụng nhau giữa các truyện tên gần giống.',
      'Sửa hành vi Back đúng thứ tự đọc: từ trang chương quay về trang truyện, quay thêm lần nữa mới về trang chủ.',
      'Bổ sung breadcrumb để quay lại từng tầng nhanh, đặc biệt hữu ích khi đọc trên điện thoại.',
      'Hoàn thiện xử lý link sai (404) và giữ khả năng mở lại link cũ để tránh gãy trải nghiệm.',
    ],
  },
  {
    version: '0.1b',
    dateLabel: '2026-03-28',
    title: 'Sửa vài lỗi nhỏ và thêm lớp bảo vệ dữ liệu',
    items: [
      'Tinh chỉnh lại một số lỗi giao diện nhỏ để app nhìn gọn, dễ đọc và bấm đỡ rối hơn.',
      'Thêm luồng sao lưu Google Drive để dữ liệu truyện có thêm một lớp an toàn khi dùng lâu dài.',
    ],
  },
  {
    version: '0.1a',
    dateLabel: '2026-03-28',
    title: 'Tăng AI trust, quan sát tiến trình và độ rõ ràng của workflow',
    items: [
      'Thêm Trung tâm sao lưu mới: có nút Sao lưu ngay, lịch sử backup ngay trong app, khôi phục theo từng mốc thời gian và cảnh báo đỏ khi để quá lâu chưa backup.',
      'Chuyển hướng từ autosync rủi ro sang manual sync: dữ liệu tài khoản giờ chỉ đồng bộ khi người dùng tự bấm tay, giúp tránh ghi đè âm thầm trong nền.',
      'Dựng lớp backup cục bộ nhiều mốc bằng IndexedDB và cho phép đẩy file JSON lên Google Drive sau mỗi lần lưu dữ liệu khi người dùng đã kết nối Drive.',
      'Chuyển lưu trữ workspace tài khoản từ Firestore/Google sang Supabase: truyện, nhân vật, AI Rules, từ điển dịch, văn mẫu và các cấu hình cục bộ giờ đồng bộ về một server thống nhất hơn.',
      'Bổ sung schema Supabase mẫu cho user_workspaces và qa_reports để việc triển khai backend lưu trữ mới rõ ràng, dễ kiểm tra và ít phụ thuộc hơn vào cấu hình cũ của Firebase.',
      'Nâng overlay AI để hiển thị rõ giai đoạn xử lý, tiến độ thực tế và phần việc đang chạy thay vì chỉ có spinner và số giây.',
      'Làm hệ thống thông báo bớt ồn hơn: gom nhóm toast trùng lặp, giới hạn số lượng hiển thị và cho phép đóng tay khi cần.',
      'Sửa Kho Prompt theo hướng dễ tin cậy hơn: có trạng thái Chưa lưu/Đã đồng bộ, tự động lưu khi đổi mục hoặc đóng modal, đồng thời nút Lưu chỉ sáng khi thực sự có thay đổi.',
      'Làm rõ trang Công cụ là bộ tool cục bộ: gắn nhãn không gọi AI, đổi tên các thao tác dễ gây hiểu nhầm và thêm lối đi rõ ràng sang luồng AI nâng cao.',
      'Giảm cảm giác quá tải ở form tạo chương bằng cách tách phần cơ bản/nâng cao và bổ sung checklist chỉ ra các trường ảnh hưởng mạnh nhất tới chất lượng đầu ra.',
      'Đổi Lịch sử cập nhật sang kiểu bấm theo từng phiên bản: mặc định chỉ hiện tên version, khi bấm mới mở nội dung và chỉ mở một phiên bản tại một thời điểm.',
      'Bổ sung tự động lưu workspace cục bộ vào tài khoản đã đăng nhập, bao gồm hồ sơ giao diện, từ điển dịch, văn mẫu, kho prompt và cấu hình ngân sách AI.',
      'Thêm translation memory theo từng bộ truyện dịch để tên riêng/thuật ngữ đã khóa ở truyện A tiếp tục được giữ nhất quán trong các chương sau mà không làm ảnh hưởng truyện B.',
      'Tích hợp luồng tạo ảnh bìa qua Raphael/Evolink API theo kiểu chạy nền trong app: bấm tạo bìa là gửi task trực tiếp, chờ kết quả trả về ngay trong giao diện, không bật popup hay tab ngoài.',
      'Đồng bộ phiên bản sản phẩm lên 0.1a và cập nhật Lịch sử cập nhật để người dùng theo dõi những thay đổi vừa triển khai.',
    ],
  },
  {
    version: '0.0a',
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
