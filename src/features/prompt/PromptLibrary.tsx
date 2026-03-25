import React from "react";
import { motion } from "motion/react";
import { Library } from "lucide-react";
import clsx from "clsx";
import { TFTabs } from "../../ui/tabs";
import { TFButton } from "../../ui/buttons";
import { TFTextarea } from "../../ui/inputs";

type TabKey = "core" | "genre";

type MasterItem = { id: string; title: string; content: string };

type PromptLibraryProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
};

export const PromptLibraryModal: React.FC<PromptLibraryProps> = ({ isOpen, onClose, onSelect }) => {
  const [selectedGroup, setSelectedGroup] = React.useState<TabKey>("core");
  const [coreRules, setCoreRules] = React.useState<MasterItem[]>([
    { id: "terms", title: "Danh từ riêng / Thuật ngữ", content: "- Giữ nguyên tên riêng, thuật ngữ khóa (Kho Name/Glossary).\n- Không phiên âm sai; nếu thiếu mapping, giữ nguyên gốc.\n- Thêm chú thích ngắn trong ngoặc khi cần làm rõ." },
    { id: "must", title: "Yêu cầu bắt buộc", content: "- Ưu tiên: Quy tắc thể loại → Kho Name → Glossary/Term lock → Timeline.\n- Không bịa sự kiện; nếu thiếu dữ liệu đánh dấu [thiếu dữ liệu].\n- Giữ consistency nhân xưng, địa danh, mốc thời gian." },
    { id: "blacklist", title: "Các điều cấm (Blacklist)", content: "- Cấm thêm 18+/nhạy cảm nếu đầu vào không có.\n- Cấm chèn link/contact/API key.\n- Cấm sai lệch fact, phá OOC không lý do.\n- Cấm meme, viết tắt chat trong văn bản." },
  ]);
  const [genreRules, setGenreRules] = React.useState<MasterItem[]>([
    { id: "co-dai", title: "Cổ đại / Tiên hiệp", content: "- Giọng văn: Cổ phong, ước lệ; nhịp chậm-trung.\n- Xưng hô: tôn ti (trẫm/vi thần/thần thiếp, bổn vương/tại hạ...).\n- Từ vựng: Hán Việt chọn lọc; tránh công nghệ/meme.\n- Cấu trúc: câu 2-3 vế, tả cảnh → tâm/cơ mưu.\n- Cấm: wow/emoji, tiếng lóng, pha tiếng Anh." },
    { id: "hien-dai", title: "Hiện đại / Hào môn", content: "- Giọng văn: Nhanh, trực diện; hào môn lạnh/sang.\n- Xưng hô: tôi/anh/em/cô + chức danh.\n- Từ vựng: business/showbiz đúng cảnh; tránh Hán Việt cổ.\n- Cấu trúc: đoạn 3-6 câu, nhiều thoại.\n- Cấm: viết tắt chat (ko, j), brand >2/đoạn." },
    { id: "khoa-hoc", title: "Võng du / Khoa học", content: "- Giọng văn: Lý tính, mô tả hệ thống rõ.\n- Xưng hô: linh hoạt theo thế giới thật/ảo.\n- Từ vựng: game chuẩn (level, cooldown, buff/debuff, PK), sci-fi (cơ giáp, gene, warp).\n- Cấu trúc: log/bảng trạng thái ngắn; ví dụ sau mô tả.\n- Cấm: bùa tiên hiệp mơ hồ; số liệu không khớp." },
  ]);

  const currentList = selectedGroup === "core" ? coreRules : genreRules;
  const [selectedId, setSelectedId] = React.useState(currentList[0].id);
  const [draftContent, setDraftContent] = React.useState(currentList[0].content);
  const selectedItem = currentList.find((i) => i.id === selectedId) || currentList[0];

  React.useEffect(() => {
    const list = selectedGroup === "core" ? coreRules : genreRules;
    setSelectedId(list[0].id);
    setDraftContent(list[0].content);
  }, [selectedGroup]);

  React.useEffect(() => {
    const item = currentList.find((i) => i.id === selectedId);
    if (item) setDraftContent(item.content);
  }, [selectedId]);

  if (!isOpen) return null;

  const setList = selectedGroup === "core" ? setCoreRules : setGenreRules;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-950 w-full max-w-5xl rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/40">
              <Library className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Kho Prompt</p>
              <h3 className="text-xl font-bold">Quy tắc & Prompt</h3>
            </div>
          </div>
          <button onClick={onClose} className="tf-btn tf-btn-ghost px-3 py-2">Đóng</button>
        </div>

        <div className="px-6 pt-4">
          <TFTabs
            tabs={[
              { key: "core", label: "Quy tắc Cốt lõi" },
              { key: "genre", label: "Theo Thể loại" },
            ]}
            active={selectedGroup}
            onChange={(k) => setSelectedGroup(k as TabKey)}
            variant="pill"
          />
        </div>

        <div className="flex flex-1 overflow-hidden min-h-[420px] bg-slate-950">
          {/* Sidebar */}
          <div className="w-[34%] border-r border-white/10 bg-slate-900/80 overflow-y-auto p-4 space-y-2">
            {currentList.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={clsx(
                  "w-full text-left px-4 py-3 rounded-md font-semibold transition-colors border",
                  selectedId === item.id
                    ? "bg-indigo-600 text-white border-indigo-400 shadow"
                    : "bg-slate-900/60 text-slate-200 border-white/5 hover:bg-slate-800"
                )}
              >
                {item.title}
              </button>
            ))}
            <button
              onClick={() => {
                const id = `new-${Date.now()}`;
                const newItem = { id, title: selectedGroup === "core" ? "Quy tắc mới" : "Nhóm mới", content: "" };
                setList((p) => [...p, newItem]);
                setSelectedId(id);
                setDraftContent("");
              }}
              className="w-full mt-3 tf-btn tf-btn-ghost justify-center"
            >
              + Thêm {selectedGroup === "core" ? "quy tắc" : "nhóm"}
            </button>
          </div>

          {/* Content */}
          <div className="w-[66%] p-6 overflow-y-auto relative space-y-4">
            <input
              value={selectedItem?.title || ""}
              onChange={(e) => {
                const next = currentList.map((i) => (i.id === selectedId ? { ...i, title: e.target.value } : i));
                setList(next);
              }}
              className="tf-input text-lg font-bold"
            />
            <TFTextarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="- Giọng văn: ...\n- Xưng hô: ...\n- Từ vựng: ...\n- Cấm: ..."
            />
            <div className="flex justify-end gap-3">
              <TFButton
                variant="ghost"
                onClick={() => {
                  onSelect(draftContent);
                  onClose();
                }}
              >
                Sao chép & đóng
              </TFButton>
              <TFButton
                variant="primary"
                onClick={() => {
                  const next = currentList.map((i) => (i.id === selectedId ? { ...i, content: draftContent } : i));
                  setList(next);
                }}
              >
                Lưu thay đổi
              </TFButton>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
