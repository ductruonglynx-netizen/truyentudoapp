import React from "react";
import clsx from "clsx";
import { TFTabs } from "../../ui/tabs";
import { TFButton } from "../../ui/buttons";
import { TFInput, TFTextarea } from "../../ui/inputs";
import { PromptLibraryModal } from "../prompt/PromptLibrary";
import { TFAlert } from "./common/TFAlert";

/**
 * ToolsPage: chứa 3 tab ngang: Hỗ trợ Dịch, Hỗ trợ Viết (Writer Pro), Kho Prompt.
 * - Cards nền tối đồng nhất
 * - Nút bo góc 8px, align phải
 */

const toolsTabs = [
  { key: "translate", label: "Hỗ trợ Dịch" },
  { key: "write", label: "Hỗ trợ Viết (Writer Pro)" },
  { key: "prompt", label: "Kho Prompt" },
];

type ToolsPageProps = {
  onBack: () => void;
  onRequireAuth: () => void;
};

export const ToolsPage: React.FC<ToolsPageProps> = ({ onBack, onRequireAuth }) => {
  const [tab, setTab] = React.useState("translate");
  const [showPrompt, setShowPrompt] = React.useState(false);

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
            <TFInput placeholder="Tên gốc" />
            <TFInput placeholder="Tên dịch" />
            <div className="flex justify-end">
              <TFButton variant="primary">Thêm</TFButton>
            </div>
          </div>
          <div className="tf-card p-4 space-y-3">
            <h3 className="text-lg font-semibold">Kiểm tra consistency</h3>
            <p className="tf-body">Quét xưng hô/thuật ngữ trong đoạn văn.</p>
            <TFTextarea placeholder="Dán đoạn cần quét..." />
            <div className="flex justify-end">
              <TFButton variant="primary">Chạy QA</TFButton>
            </div>
          </div>
        </section>
      )}

      {tab === "write" && (
        <section className="grid md:grid-cols-2 gap-4">
          <div className="tf-card p-4 space-y-3">
            <h3 className="text-lg font-semibold">Gợi ý cốt truyện</h3>
            <TFTextarea placeholder="Tóm tắt/brief..." />
            <div className="flex justify-end">
              <TFButton variant="primary">Sinh ý tưởng</TFButton>
            </div>
          </div>
          <div className="tf-card p-4 space-y-3">
            <h3 className="text-lg font-semibold">Giữ giọng văn</h3>
            <TFTextarea placeholder="Dán mẫu giọng văn..." />
            <div className="flex justify-end">
              <TFButton variant="primary">Huấn luyện tạm</TFButton>
            </div>
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
            <TFButton variant="primary" onClick={() => setShowPrompt(true)}>Mở kho prompt</TFButton>
          </div>
          <TFAlert tone="warn">Prompt mẫu chỉ là gợi ý, bạn có thể chỉnh sửa trực tiếp.</TFAlert>
        </section>
      )}

      <PromptLibraryModal
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        onSelect={() => setShowPrompt(false)}
      />
    </div>
  );
};
