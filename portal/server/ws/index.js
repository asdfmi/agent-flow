import { WebSocketServer, WebSocket } from 'ws';
import bus from '../events/bus.js';

export function initWs(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const subscriptions = new Map(); // runId -> Set<ws>

  const addSub = (runId, ws) => {
    const key = String(runId);
    let set = subscriptions.get(key);
    if (!set) {
      set = new Set();
      subscriptions.set(key, set);
    }
    set.add(ws);
  };

  const removeWs = (ws) => {
    for (const set of subscriptions.values()) set.delete(ws);
  };

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(String(data));
        if (msg.type === 'subscribe' && msg.runId) {
          addSub(msg.runId, ws);
          ws.send(JSON.stringify({ type: 'subscribed', runId: String(msg.runId) }));
        } else if (msg.type === 'unsubscribe' && msg.runId) {
          const set = subscriptions.get(String(msg.runId));
          set?.delete(ws);
        } else if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
        }
      } catch {
        // ignore
      }
    });

    ws.on('close', () => removeWs(ws));
    ws.on('error', () => removeWs(ws));
  });

  const heart = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heart));

  const onEvent = (evt) => {
    const set = subscriptions.get(String(evt.runId));
    if (!set || set.size === 0) return;
    const payload = JSON.stringify(evt);
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  };

  bus.on('event', onEvent);

  return wss;
}
