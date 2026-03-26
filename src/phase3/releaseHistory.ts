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
    title: 'Tang do bam context cho Writer Pro',
    items: [
      'Nang cap prompt Writer Pro de bam chat objective, timeline, glossary va Universe Wiki truoc khi sinh noi dung.',
      'Tu dong khoa glossary sau khi AI tra ve, giam tinh trang ten rieng va thuat ngu bi troi lai ve ban goc.',
      'Bo sung Context Readiness de canh bao khi du lieu dau vao con thieu, giup AI hoat dong on dinh hon.',
      'Them muc Lich su cap nhat nho ngay trong giao dien de theo doi thay doi cua san pham.',
    ],
  },
];
