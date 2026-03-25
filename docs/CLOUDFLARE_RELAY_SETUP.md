# Cloudflare Relay Setup

TruyenForge có thể dùng Cloudflare Worker + Durable Object làm WebSocket relay thay cho Railway.

## Thư mục worker

- `workers/relay-worker/src/index.ts`
- `workers/relay-worker/wrangler.toml`

## Triển khai nhanh

1. Cài Wrangler:
   `npm install -g wrangler`
2. Đăng nhập:
   `wrangler login`
3. Vào thư mục worker:
   `cd workers/relay-worker`
4. Deploy:
   `wrangler deploy`

Sau khi deploy, bạn sẽ có domain kiểu:

`https://truyenforge-relay.<your-subdomain>.workers.dev`

WebSocket endpoint sẽ là:

`wss://truyenforge-relay.<your-subdomain>.workers.dev/?code=182004`

## Cấu hình TruyenForge

Đặt vào `.env.local` hoặc biến môi trường deploy:

```env
VITE_RELAY_WS_BASE="wss://truyenforge-relay.<your-subdomain>.workers.dev/?code="
VITE_RELAY_WEB_BASE="https://truyenforge-relay.<your-subdomain>.workers.dev/"
```

## Luồng hoạt động

1. Web truyện tạo `relayCode`.
2. Web truyện mở WebSocket tới Worker:
   `wss://...workers.dev/?code=<relayCode>`
3. TruyenForge mở AI Studio bridge với:
   `https://ais-dev-...run.app/?code=<relayCode>&relay=wss://...workers.dev/?code=<relayCode>`
4. Bridge authorize xong sẽ gửi:
   ```json
   {
     "type": "TOKEN_TRANSFER",
     "token": "...",
     "uid": "...",
     "email": "..."
   }
   ```
5. Web truyện nhận `TOKEN_TRANSFER` và lưu token.

## Lưu ý

- Nếu bridge AI Studio của bạn đang hardcode Railway relay, bạn cần cập nhật bridge để nó đọc tham số `relay` từ query string.
- Worker hiện hỗ trợ `ping`, `subscribe`, `auth`, `TOKEN_TRANSFER` và echo debug cơ bản.
