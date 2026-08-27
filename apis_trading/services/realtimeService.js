const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const priceService = require("./priceService");

/**
 * Pushes live updates to the browser instead of the browser asking over and
 * over.
 *
 * Three kinds of message go out:
 *
 *   prices        -> everyone connected
 *   order:filled  -> only the user whose order it was
 *   notification  -> only the user it belongs to
 *
 * The whole thing is one WebSocket server sharing the same port as the API.
 */

// How often we send price updates. Binance pushes many times per second;
// forwarding every one of those would flood the browser for no benefit.
const PRICE_INTERVAL_MS = 1000;

// If a connection does not answer a ping within this long, it is dead.
const HEARTBEAT_MS = 30_000;

/** userId -> Set of open sockets (one person can have several tabs open) */
const clients = new Map();

let wss = null;
let priceTimer = null;
let heartbeatTimer = null;
let lastSent = new Map();

/* ===================================================================== */
/*  Helpers                                                              */
/* ===================================================================== */

/** Pulls one cookie out of a raw Cookie header. */
function readCookie(header, name) {
  if (!header) return null;

  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function addClient(userId, socket) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(socket);
}

function removeClient(userId, socket) {
  const set = clients.get(userId);
  if (!set) return;

  set.delete(socket);

  // Drop the empty set too, otherwise the map grows forever as users come
  // and go — a slow memory leak that only shows up in production.
  if (set.size === 0) clients.delete(userId);
}

function send(socket, type, data) {
  if (socket.readyState !== WebSocket.OPEN) return;

  try {
    socket.send(JSON.stringify({ type, data, at: Date.now() }));
  } catch (error) {
    console.error("[realtime] send failed:", error.message);
  }
}

/* ===================================================================== */
/*  Starting up                                                          */
/* ===================================================================== */

/**
 * @param {import("http").Server} server  the server returned by app.listen()
 * @param {string[]} allowedOrigins       the same list the CORS config uses
 */
function start(server, allowedOrigins = []) {
  if (wss) return;

  // noServer means WE decide which upgrade requests to accept, which is what
  // lets us check the cookie and the origin before letting anyone in.
  wss = new WebSocket.Server({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const reject = (code, why) => {
      socket.write(`HTTP/1.1 ${code} ${why}\r\n\r\n`);
      socket.destroy();
    };

    // Only our endpoint. Anything else is not ours to answer.
    if (!req.url || !req.url.startsWith("/ws")) {
      return reject(404, "Not Found");
    }

    // ---- origin check ------------------------------------------------
    // WebSockets do NOT go through CORS. A page on any other site could
    // open a socket to this server, and the browser would happily attach
    // the user's cookie. Checking Origin ourselves is what stops that.
    const origin = req.headers.origin;
    if (origin && allowedOrigins.length && !allowedOrigins.includes(origin)) {
      console.log("[realtime] blocked origin:", origin);
      return reject(403, "Forbidden");
    }

    // ---- who is this? -------------------------------------------------
    const token = readCookie(req.headers.cookie, "token");
    if (!token) return reject(401, "Unauthorized");

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return reject(401, "Unauthorized");
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.userId = String(payload.id);
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws) => {
    addClient(ws.userId, ws);

    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("close", () => removeClient(ws.userId, ws));
    ws.on("error", () => removeClient(ws.userId, ws));

    // Send the current prices straight away so a new tab is not blank until
    // the next tick.
    send(ws, "prices", priceService.getAllTickers());
    send(ws, "connected", { userId: ws.userId });
  });

  priceTimer = setInterval(broadcastPrices, PRICE_INTERVAL_MS);

  // Browsers do not always close cleanly — a laptop lid closing leaves a
  // socket that looks open forever. Ping everyone; anything that did not
  // answer the last round is gone.
  heartbeatTimer = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_MS);

  console.log("[realtime] websocket ready on /ws");
}

function stop() {
  if (priceTimer) clearInterval(priceTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (wss) wss.close();
  priceTimer = heartbeatTimer = wss = null;
  clients.clear();
  lastSent = new Map();
}

/* ===================================================================== */
/*  Sending                                                              */
/* ===================================================================== */

/**
 * Prices, once a second, to everyone.
 *
 * Only symbols whose price actually moved are included. In a quiet market
 * that means we send almost nothing instead of the same numbers every second.
 */
function broadcastPrices() {
  if (!wss || wss.clients.size === 0) return;

  const changed = [];

  for (const ticker of priceService.getAllTickers()) {
    if (lastSent.get(ticker.symbol) !== ticker.price) {
      lastSent.set(ticker.symbol, ticker.price);
      changed.push(ticker);
    }
  }

  if (changed.length === 0) return;

  for (const ws of wss.clients) send(ws, "prices", changed);
}

/**
 * Sends to one user, on every tab they have open.
 * Silently does nothing if they are not connected — which is normal.
 */
function toUser(userId, type, data) {
  const sockets = clients.get(String(userId));
  if (!sockets) return 0;

  for (const ws of sockets) send(ws, type, data);
  return sockets.size;
}

/** Convenience wrappers so callers do not have to remember event names */
const orderFilled = (userId, payload) => toUser(userId, "order:filled", payload);
const notification = (userId, payload) => toUser(userId, "notification", payload);
const balanceChanged = (userId, payload) => toUser(userId, "balances", payload);

/** For /health and tests */
function stats() {
  return {
    connected: wss ? wss.clients.size : 0,
    users: clients.size,
  };
}

module.exports = {
  start,
  stop,
  toUser,
  orderFilled,
  notification,
  balanceChanged,
  stats,
  readCookie,
};
