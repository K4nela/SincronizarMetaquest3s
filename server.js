const path = require("path");
const http = require("http");
const express = require("express");
const WebSocket = require("ws");

const PORT = Number(process.env.PORT || 8080);
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const devices = new Map();
const panels = new Set();
let playback = {
  state: "stopped", // stopped | scheduled | playing | paused | ended
  positionMs: 0,
  durationMs: 180000,
  scheduledAt: null,
  updatedAt: Date.now()
};
let demoMode = false;
let playbackTimer = null;

function send(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}
function broadcast(payload) {
  const msg = JSON.stringify(payload);
  for (const ws of [...panels, ...[...devices.values()].map(d => d.ws).filter(Boolean)]) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}
function positionNow() {
  if (playback.state === "playing") {
    return Math.min(playback.durationMs, playback.positionMs + (Date.now() - playback.updatedAt));
  }
  return playback.positionMs;
}
function publicStatus() {
  const now = Date.now();
  const list = [];
  for (let i = 1; i <= 10; i++) {
    const id = `Q${String(i).padStart(2, "0")}`;
    const d = devices.get(id);
    list.push({
      id,
      connected: !!(d && (d.simulated || (d.ws && d.ws.readyState === WebSocket.OPEN))),
      ready: !!(d && d.ready),
      simulated: !!(d && d.simulated),
      lastSeen: d ? d.lastSeen : null,
      positionMs: d && Number.isFinite(d.positionMs) ? d.positionMs : null
    });
  }
  return {
    devices: list,
    playback: {
      ...playback,
      positionMs: Math.round(positionNow()),
      serverNow: now
    },
    demoMode
  };
}
function publishStatus() {
  broadcast({ type: "STATUS", data: publicStatus() });
}
function setState(state, positionMs = positionNow()) {
  playback.state = state;
  playback.positionMs = Math.max(0, Math.min(playback.durationMs, positionMs));
  playback.updatedAt = Date.now();
  playback.scheduledAt = null;
  publishStatus();
}
function scheduleCommand(command) {
  if (playbackTimer) clearTimeout(playbackTimer);
  const startAt = Date.now() + 1800;
  const position = command === "PLAY" && playback.state === "paused" ? positionNow() : 0;
  playback.state = "scheduled";
  playback.scheduledAt = startAt;
  playback.updatedAt = Date.now();
  broadcast({
    type: "COMMAND",
    command,
    startAt,
    positionMs: Math.round(position),
    sessionId: `S-${Date.now()}`
  });
  publishStatus();
  playbackTimer = setTimeout(() => {
    if (command === "PLAY") {
      playback.state = "playing";
      playback.positionMs = position;
      playback.updatedAt = Date.now();
      playback.scheduledAt = null;
      publishStatus();
      playbackTimer = setTimeout(() => {
        if (playback.state === "playing" && positionNow() >= playback.durationMs) {
          setState("ended", playback.durationMs);
        }
      }, Math.max(0, playback.durationMs - position));
    } else if (command === "PAUSE") {
      setState("paused", position);
    } else if (command === "RESTART") {
      playback.state = "playing";
      playback.positionMs = 0;
      playback.updatedAt = Date.now();
      playback.scheduledAt = null;
      publishStatus();
      playbackTimer = setTimeout(() => setState("ended", playback.durationMs), playback.durationMs);
    }
  }, 1800);
}

app.get("/api/status", (_req, res) => res.json(publicStatus()));
app.post("/api/demo", (_req, res) => {
  demoMode = true;
  for (let i = 1; i <= 10; i++) {
    const id = `Q${String(i).padStart(2, "0")}`;
    devices.set(id, {
      ws: null, ready: true, simulated: true, lastSeen: Date.now(), positionMs: 0
    });
  }
  publishStatus();
  res.json({ ok: true, status: publicStatus() });
});
app.post("/api/command", (req, res) => {
  const command = String(req.body && req.body.command || "").toUpperCase();
  if (!["PLAY", "PAUSE", "RESTART"].includes(command)) {
    return res.status(400).json({ ok: false, error: "Comando inválido." });
  }
  if (command === "PLAY" && playback.state === "playing") {
    return res.json({ ok: true, ignored: true, status: publicStatus() });
  }
  if (command === "PAUSE" && !["playing", "scheduled"].includes(playback.state)) {
    return res.status(409).json({ ok: false, error: "Não há reprodução ativa para pausar." });
  }
  if (command === "RESTART" && playback.state === "stopped") {
    // Restart is allowed from stopped and starts from zero.
  }
  scheduleCommand(command);
  res.json({ ok: true, scheduledAt: Date.now() + 1800 });
});

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });
  send(ws, { type: "WELCOME", status: publicStatus() });

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (msg.role === "panel") {
      panels.add(ws);
      send(ws, { type: "STATUS", data: publicStatus() });
      return;
    }
    if (msg.role === "device" && typeof msg.id === "string" && /^Q(0[1-9]|10)$/.test(msg.id)) {
      const previous = devices.get(msg.id);
      if (previous && previous.ws && previous.ws !== ws) {
        try { previous.ws.close(); } catch {}
      }
      devices.set(msg.id, {
        ws, ready: !!msg.ready, simulated: false, lastSeen: Date.now(),
        positionMs: Number(msg.positionMs || 0)
      });
      ws.deviceId = msg.id;
      publishStatus();
      return;
    }
    if (msg.type === "DEVICE_STATUS" && ws.deviceId) {
      const d = devices.get(ws.deviceId);
      if (d) {
        d.ready = !!msg.ready;
        d.lastSeen = Date.now();
        if (Number.isFinite(msg.positionMs)) d.positionMs = msg.positionMs;
        publishStatus();
      }
    }
    if (msg.type === "HEARTBEAT" && ws.deviceId) {
      const d = devices.get(ws.deviceId);
      if (d) d.lastSeen = Date.now();
    }
  });

  ws.on("close", () => {
    panels.delete(ws);
    if (ws.deviceId) {
      const d = devices.get(ws.deviceId);
      if (d && d.ws === ws) {
        devices.delete(ws.deviceId);
        publishStatus();
      }
    }
  });
});

const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 15000);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor Quest 3S disponível na porta ${PORT}`);
  console.log(`No celular, abra http://IP-DO-NOTEBOOK:${PORT}`);
});
process.on("SIGINT", () => {
  clearInterval(heartbeat);
  if (playbackTimer) clearTimeout(playbackTimer);
  server.close(() => process.exit(0));
});
