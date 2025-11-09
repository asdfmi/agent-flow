import { WebSocketServer } from 'ws';

export function createWsRunEventHub({ path = '/ws' } = {}) {
  const subscriptions = new Map(); // runId -> Set<socket>
  const socketKeys = new WeakMap(); // socket -> Set<runId>
  let wss = null;

  function attach(server) {
    wss = new WebSocketServer({ server, path });
    wss.on('connection', (socket) => {
      socket.on('message', (data) => handleMessage(socket, data));
      socket.on('close', () => cleanup(socket));
      socket.on('error', () => cleanup(socket));
    });
  }

  function handleMessage(socket, data) {
    let message;
    try {
      message = JSON.parse(String(data));
    } catch {
      return;
    }
    const runId = typeof message?.runId === 'string' ? message.runId : '';
    if (!runId) return;
    if (message.type === 'subscribe') {
      subscribe(socket, runId);
    } else if (message.type === 'unsubscribe') {
      unsubscribe(socket, runId);
    }
  }

  function subscribe(socket, runId) {
    const sockets = subscriptions.get(runId) ?? new Set();
    sockets.add(socket);
    subscriptions.set(runId, sockets);
    const runs = socketKeys.get(socket) ?? new Set();
    runs.add(runId);
    socketKeys.set(socket, runs);
  }

  function unsubscribe(socket, runId) {
    const sockets = subscriptions.get(runId);
    if (sockets) {
      sockets.delete(socket);
      if (sockets.size === 0) {
        subscriptions.delete(runId);
      }
    }
    const runs = socketKeys.get(socket);
    if (runs) {
      runs.delete(runId);
      if (runs.size === 0) {
        socketKeys.delete(socket);
      }
    }
  }

  function cleanup(socket) {
    const runs = socketKeys.get(socket);
    if (!runs) return;
    for (const runId of runs) {
      const sockets = subscriptions.get(runId);
      if (sockets) {
        sockets.delete(socket);
        if (sockets.size === 0) {
          subscriptions.delete(runId);
        }
      }
    }
    socketKeys.delete(socket);
  }

  function broadcast(runId, payload) {
    const sockets = subscriptions.get(runId);
    if (!sockets || sockets.size === 0) return;
    const body = JSON.stringify({ ...payload, runId });
    for (const socket of sockets) {
      if (socket.readyState === socket.OPEN) {
        socket.send(body);
      } else {
        unsubscribe(socket, runId);
      }
    }
  }

  return { attach, broadcast };
}
