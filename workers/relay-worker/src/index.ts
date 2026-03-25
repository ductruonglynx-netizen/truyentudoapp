// @ts-nocheck
export interface Env {
  RELAY_ROOMS: DurableObjectNamespace;
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

function readCode(request: Request): string {
  const url = new URL(request.url);
  return String(url.searchParams.get('code') || '').trim();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({ ok: true, service: 'truyenforge-relay-worker', now: new Date().toISOString() });
    }

    const code = readCode(request);
    if (!/^\d{4,8}$/.test(code)) {
      return json({ ok: false, error: 'Missing or invalid relay code (4-8 digits required).' }, { status: 400 });
    }

    const id = env.RELAY_ROOMS.idFromName(code);
    const stub = env.RELAY_ROOMS.get(id);
    return stub.fetch(request);
  },
};

type RelayEnvelope = {
  type?: string;
  token?: string;
  uid?: string;
  email?: string;
  code?: string;
  long?: string;
  [key: string]: unknown;
};

export class RelayRoom {
  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return json({
        ok: true,
        transport: 'websocket',
        message: 'Connect with wss://<worker-domain>/?code=123456',
      });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);

    server.send(JSON.stringify({ type: 'READY', message: 'Relay room connected.' }));
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    const raw = typeof message === 'string' ? message : new TextDecoder().decode(message);
    let payload: RelayEnvelope = {};

    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { type: 'RAW', raw };
    }

    if (payload.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
      return;
    }

    if (payload.type === 'TOKEN_TRANSFER') {
      const broadcast = JSON.stringify({
        type: 'TOKEN_TRANSFER',
        token: String(payload.token || ''),
        uid: String(payload.uid || ''),
        email: String(payload.email || ''),
        code: String(payload.code || ''),
        long: String(payload.long || ''),
        receivedAt: new Date().toISOString(),
      });

      for (const socket of this.state.getWebSockets()) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(broadcast);
        }
      }
      return;
    }

    if (payload.type === 'subscribe' || payload.type === 'auth') {
      ws.send(JSON.stringify({ type: 'ACK', sourceType: payload.type || 'unknown' }));
      return;
    }

    // Default: echo to keep debugging simple across clients in the same room.
    const echo = JSON.stringify({ type: 'ECHO', payload, receivedAt: new Date().toISOString() });
    for (const socket of this.state.getWebSockets()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(echo);
      }
    }
  }

  webSocketClose(ws: WebSocket): void {
    try {
      ws.close();
    } catch {
      // no-op
    }
  }
}
