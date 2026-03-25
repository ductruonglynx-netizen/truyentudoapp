# TruyenForge AI – Web + PWA cho tác giả và dịch giả

TruyenForge AI là playground web/PWA giúp tác giả, dịch giả và biên tập viên cộng tác với AI: dịch chương, gợi ý cốt truyện, đổi giọng văn, quét chất lượng, và quản lý thế giới hư cấu (wiki/timeline/graph). Kiến trúc mô phỏng đa nhà cung cấp model, FinOps quota, cache, fallback, và chế độ offline/sync cơ bản.

## Tính năng chính
- Phase 1 – Translator: màn split-view, 3 gợi ý dịch/segment, glossary lock + retry, Translation Memory exact/fuzzy, KPI vi phạm glossary.
- Phase 2 – QA & hậu kỳ: proofread + consistency scan (glossary/xưng hô/timeline), Quality Center assign/resolve, pipeline DRAFT → PUBLISHED, local KPI thời gian post-edit.
- Phase 3 – Writer Pro: auto-complete 3 biến thể 50/100/200 từ, plot generator, tone shift presets, context Q&A, wiki extraction; Hierarchical context + GraphRAG node/edge từ Universe timeline/characters/locations/items. FinOps control ngay trên header.
- Phase 4 – Scale & PWA: offline drafting với IndexedDB, sync queue mô phỏng, service worker cache shell, quota/observability dashboard.
- Phase 5 – Release checks: các gate (glossary pass-rate, latency, queue health, crash-free) và xuất báo cáo JSON.

## Kiến trúc & kỹ thuật nổi bật
- AI Gateway + FinOps: router đa nhà cung cấp (OpenAI/Anthropic/Gemini) với budget check, cost estimation, cache session, failover và fallback mock khi hết quota.
- Context tăng tốc: Hierarchical summarization + GraphRAG node/edge; semantic/cache theo fingerprint; background job cho tác vụ nặng (mô phỏng).
- Collaboration nền tảng: CRDT (Yjs) hook sẵn trong editor, sẵn sàng mở multiplayer; debounce, requestIdle cho preview.
- PWA/offline: IndexedDB lưu nháp, hàng đợi đồng bộ, service worker cache shell, export queue mô phỏng.

## Chạy nhanh (local)
```bash
npm install
npm run dev
# mở http://localhost:3000
```

## Chế độ demo theo phase (route query)
- Phase 0 demo: `/?phase0=1`
- Phase 1 Translator MVP: `/?phase1=1`
- Phase 2 QA & hậu kỳ: `/?phase2=1`
- Phase 3 Writer Pro: `/?phase3=1`
- Phase 4 Scale & PWA: `/?phase4=1`
- Phase 5 Release checks: `/?phase5=1`

## Cấu hình relay (tùy chọn, giống bản gốc)
- `VITE_RELAY_WS_BASE=wss://relay2026.up.railway.app/?code=`
- `VITE_RELAY_WEB_BASE=https://relay2026.vercel.app/`
Nhập URL WebSocket trong tab Relay: ví dụ `wss://relay2026.up.railway.app/?code=1810`. Relay health: https://relay2026.up.railway.app/health.

## FinOps nhanh (mock, client-side)
- Budget mặc định 20 USD/chu kỳ 28 ngày, lưu localStorage.
- Kiểm tra trước mỗi call; hết quota sẽ fallback model mock.
- Có nút chỉnh hạn mức và reset chu kỳ tại Phase 1 (Translator) và Phase 3 header.

## Thư mục chính
- `src/phase0` Gateway/API config, model router.
- `src/phase1` Translator workspace + TM + glossary.
- `src/phase2` QA engine + Quality Center.
- `src/phase3` Writer engine (autocomplete/plot/tone/context/wiki) + GraphRAG.
- `src/phase4` Offline/PWA sync queue.
- `src/phase5` Release checks.
- `src/finops.ts` Budget/cost helper; `docs/MASTER_TECH_SPEC_ROADMAP.md` bản master spec/roadmap.

## Build
```bash
npm run lint -- --noEmit
npm run build
```

> Lưu ý: Đây là playground mô phỏng sản phẩm; kết nối model thật cần đặt API key ở Phase 1/3 và cân nhắc chính sách data retention của nhà cung cấp.
