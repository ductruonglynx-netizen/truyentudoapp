import React from "react";
import { TFTabs } from "../../ui/tabs";
import { TFButton } from "../../ui/buttons";
import { TFInput, TFTextarea } from "../../ui/inputs";
import { PromptLibraryModal } from "../prompt/PromptLibrary";
import { TFAlert } from "./common/TFAlert";
import { storage } from "../../storage";
import { notifyApp } from "../../notifications";

const toolsTabs = [
  { key: "translate", label: "Hỗ trợ Dịch" },
  { key: "write", label: "Hỗ trợ Viết (Writer Pro)" },
  { key: "prompt", label: "Kho Prompt" },
];

type ToolsPageProps = {
  onBack: () => void;
  onRequireAuth: () => void;
};

function buildConsistencyNotes(source: string, dictionary: Array<{ original?: string; translation?: string }>): string[] {
  const notes: string[] = [];
  const text = String(source || "").trim();
  if (!text) return ["Chưa có nội dung để kiểm tra."];
  dictionary.forEach((entry) => {
    const original = String(entry.original || "").trim();
    const translation = String(entry.translation || "").trim();
    if (!original || !translation) return;
    const hasOriginal = text.includes(original);
    const hasTranslation = text.includes(translation);
    if (hasOriginal && !hasTranslation) {
      notes.push(`Phát hiện "${original}" nhưng chưa thấy bản dịch "${translation}".`);
    }
    if (hasOriginal && hasTranslation) {
      notes.push(`Đoạn văn đang lẫn cả "${original}" và "${translation}", nên rà lại consistency.`);
    }
  });
  return notes.length ? notes : ["Không phát hiện lỗi consistency rõ ràng theo từ điển hiện có."];
}

function buildStoryIdeas(brief: string): string {
  const clean = String(brief || "").trim();
  if (!clean) return "";
  const fragments = clean
    .split(/[\n,.!?;:]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
  const seeds = fragments.length ? fragments : [clean.slice(0, 120)];
  return [
    "1. Mở truyện:",
    `Nhân vật chính bị đẩy vào tình thế không thể lùi sau khi ${seeds[0].toLowerCase()}.`,
    "",
    "2. Bước ngoặt:",
    `Một bí mật liên quan đến ${seeds[1] || seeds[0]} khiến toàn bộ mục tiêu ban đầu bị đảo chiều.`,
    "",
    "3. Cao trào:",
    `Nhân vật phải chọn giữa ${seeds[2] || "lý trí"} và ${seeds[3] || "điều mình thật sự muốn bảo vệ"}.`,
    "",
    "4. Hook chương tiếp:",
    "Kết mỗi chương bằng một thông tin mới, một lời thú nhận hoặc một hậu quả không thể rút lại.",
  ].join("\n");
}

export const ToolsPage: React.FC<ToolsPageProps> = ({ onBack, onRequireAuth }) => {
  const [tab, setTab] = React.useState("translate");
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [newOriginal, setNewOriginal] = React.useState("");
  const [newTranslation, setNewTranslation] = React.useState("");
  const [dictionaryRows, setDictionaryRows] = React.useState(() => storage.getTranslationNames());
  const [consistencyInput, setConsistencyInput] = React.useState("");
  const [consistencyResult, setConsistencyResult] = React.useState<string[]>([]);
  const [ideaBrief, setIdeaBrief] = React.useState("");
  const [ideaResult, setIdeaResult] = React.useState("");
  const [styleDraft, setStyleDraft] = React.useState("");

  const refreshDictionary = React.useCallback(() => {
    setDictionaryRows(storage.getTranslationNames());
  }, []);

  return (
    <div className="space-y-6 pt-24 pb-12 px-2 md:px-0">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold text-slate-100">Công cụ</h2>
        <TFButton variant="ghost" onClick={onBack}>Quay lại</TFButton>
      </div>

      <TFTabs tabs={toolsTabs} active={tab} onChange={setTab} variant="pill" />

      {tab === "translate" && (
        <section className="grid md:grid-cols-2 gap-4">
          <div className="tf-card p-4 space-y-3">
            <h3 className="text-lg font-semibold">Từ điển tên riêng</h3>
            <p className="tf-body">Khóa tên & thuật ngữ bắt buộc trước khi dịch.</p>
            <TFInput value={newOriginal} onChange={(e) => setNewOriginal(e.target.value)} placeholder="Tên gốc" />
            <TFInput value={newTranslation} onChange={(e) => setNewTranslation(e.target.value)} placeholder="Tên dịch" />
            {dictionaryRows.length ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-300 space-y-2 max-h-48 overflow-y-auto">
                {dictionaryRows.slice(0, 8).map((row: any, index: number) => (
                  <div key={`${row.original}-${row.translation}-${index}`} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.original} {'->'} {row.translation}</span>
                    <button
                      onClick={() => {
                        const next = dictionaryRows.filter((_: unknown, idx: number) => idx !== index);
                        storage.saveTranslationNames(next);
                        refreshDictionary();
                        notifyApp({ tone: "success", message: "Đã xóa mục khỏi từ điển." });
                      }}
                      className="text-xs font-semibold text-rose-300 hover:text-rose-200"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex justify-end">
              <TFButton
                variant="primary"
                onClick={() => {
                  const original = newOriginal.trim();
                  const translation = newTranslation.trim();
                  if (!original || !translation) {
                    notifyApp({ tone: "warn", message: "Điền đủ tên gốc và tên dịch trước khi thêm." });
                    return;
                  }
                  const next = [
                    { original, translation },
                    ...dictionaryRows.filter((row: any) => String(row.original || "").trim().toLowerCase() !== original.toLowerCase()),
                  ];
                  storage.saveTranslationNames(next);
                  setNewOriginal("");
                  setNewTranslation("");
                  refreshDictionary();
                  notifyApp({ tone: "success", message: "Đã thêm mục mới vào từ điển tên riêng." });
                }}
              >
                Thêm
              </TFButton>
            </div>
          </div>
          <div className="tf-card p-4 space-y-3">
            <h3 className="text-lg font-semibold">Kiểm tra consistency</h3>
            <p className="tf-body">Quét xưng hô/thuật ngữ trong đoạn văn.</p>
            <TFTextarea value={consistencyInput} onChange={(e) => setConsistencyInput(e.target.value)} placeholder="Dán đoạn cần quét..." />
            {consistencyResult.length ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-300 space-y-2">
                {consistencyResult.map((item, index) => (
                  <p key={`${item}-${index}`}>{item}</p>
                ))}
              </div>
            ) : null}
            <div className="flex justify-end">
              <TFButton
                variant="primary"
                onClick={() => {
                  const notes = buildConsistencyNotes(consistencyInput, storage.getTranslationNames());
                  setConsistencyResult(notes);
                  notifyApp({ tone: "info", message: "Đã chạy kiểm tra consistency cho đoạn văn." });
                }}
              >
                Chạy QA
              </TFButton>
            </div>
          </div>
        </section>
      )}

      {tab === "write" && (
        <section className="grid md:grid-cols-2 gap-4">
          <div className="tf-card p-4 space-y-3">
            <h3 className="text-lg font-semibold">Gợi ý cốt truyện</h3>
            <TFTextarea value={ideaBrief} onChange={(e) => setIdeaBrief(e.target.value)} placeholder="Tóm tắt/brief..." />
            {ideaResult ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-sm whitespace-pre-wrap text-slate-300">
                {ideaResult}
              </div>
            ) : null}
            <div className="flex justify-end">
              <TFButton
                variant="primary"
                onClick={() => {
                  const result = buildStoryIdeas(ideaBrief);
                  if (!result) {
                    notifyApp({ tone: "warn", message: "Nhập brief trước khi sinh ý tưởng." });
                    return;
                  }
                  setIdeaResult(result);
                  notifyApp({ tone: "success", message: "Đã tạo gợi ý cốt truyện nhanh." });
                }}
              >
                Sinh ý tưởng
              </TFButton>
            </div>
          </div>
          <div className="tf-card p-4 space-y-3">
            <h3 className="text-lg font-semibold">Giữ giọng văn</h3>
            <TFTextarea value={styleDraft} onChange={(e) => setStyleDraft(e.target.value)} placeholder="Dán mẫu giọng văn..." />
            <div className="flex justify-end">
              <TFButton
                variant="primary"
                onClick={() => {
                  const content = styleDraft.trim();
                  if (!content) {
                    notifyApp({ tone: "warn", message: "Dán văn mẫu trước khi lưu." });
                    return;
                  }
                  const next = [
                    { id: `style-${Date.now()}`, title: `Văn mẫu ${new Date().toLocaleTimeString('vi-VN')}`, content, createdAt: new Date().toISOString() },
                    ...storage.getStyleReferences(),
                  ];
                  storage.saveStyleReferences(next);
                  notifyApp({ tone: "success", message: "Đã lưu văn mẫu để dùng lại sau." });
                }}
              >
                Lưu văn mẫu
              </TFButton>
            </div>
            <TFAlert tone="success">Mục này giờ đã lưu thật vào bộ nhớ cục bộ thay vì là nút placeholder.</TFAlert>
          </div>
        </section>
      )}

      {tab === "prompt" && (
        <section className="tf-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Kho Prompt</h3>
              <p className="tf-body">Quản lý quy tắc cốt lõi và theo thể loại.</p>
            </div>
            <TFButton
              variant="primary"
              onClick={() => {
                if (typeof onRequireAuth === "function") {
                  // Kho prompt hiện dùng local storage, không cần đăng nhập nhưng vẫn giữ hook nếu sản phẩm cần mở rộng sau.
                }
                setShowPrompt(true);
              }}
            >
              Mở kho prompt
            </TFButton>
          </div>
          <TFAlert tone="warn">Prompt mẫu giờ đã có lưu bền; chỉnh xong đóng/mở lại sẽ không mất.</TFAlert>
        </section>
      )}

      <PromptLibraryModal
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        onSelect={(prompt) => {
          setShowPrompt(false);
          setIdeaBrief((prev) => prev || prompt);
          notifyApp({ tone: "success", message: "Đã lấy prompt từ kho mẫu." });
        }}
      />
    </div>
  );
};
