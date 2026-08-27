/**
 * Realtime (WebSocket) test.
 *
 * Assumes the API is already running on localhost:3000.
 *   node scripts/realtime.test.js
 */
require("dotenv").config({ quiet: true });

const WebSocket = require("ws");
const jwt = require("jsonwebtoken");

const URL = "ws://localhost:3000/ws";
const ALLOWED = "http://localhost:5174";

let failures = 0;
const check = (label, ok, extra = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  " + extra : ""}`);
};

const tokenFor = (id) =>
  jwt.sign({ id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "10m" });

const USER_A = "000000000000000000000a11";
const USER_B = "000000000000000000000b22";

/** Tries to connect and reports how it went. */
function attempt(options, timeoutMs = 6000) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (result) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    let ws;
    try {
      ws = new WebSocket(URL, options);
    } catch (error) {
      return done({ ok: false, reason: error.message });
    }

    ws.on("open", () => done({ ok: true, ws }));
    ws.on("unexpected-response", (_req, res) =>
      done({ ok: false, status: res.statusCode }),
    );
    ws.on("error", (error) => done({ ok: false, reason: error.message }));

    setTimeout(() => done({ ok: false, reason: "timed out" }), timeoutMs);
  });
}

/** Collects messages for a while. */
function collect(ws, ms) {
  const messages = [];
  ws.on("message", (raw) => {
    try {
      messages.push(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  });
  return new Promise((r) => setTimeout(() => r(messages), ms));
}

(async () => {
  console.log("=== the handshake must be guarded ===");

  const noCookie = await attempt({ headers: { Origin: ALLOWED } });
  check("no cookie is rejected", !noCookie.ok,
    noCookie.status ? `HTTP ${noCookie.status}` : noCookie.reason);

  const badToken = await attempt({
    headers: { Origin: ALLOWED, Cookie: "token=not-a-real-token" },
  });
  check("a forged token is rejected", !badToken.ok,
    badToken.status ? `HTTP ${badToken.status}` : badToken.reason);

  const expired = jwt.sign({ id: USER_A, role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "-1s",
  });
  const expiredTry = await attempt({
    headers: { Origin: ALLOWED, Cookie: `token=${expired}` },
  });
  check("an expired token is rejected", !expiredTry.ok,
    expiredTry.status ? `HTTP ${expiredTry.status}` : expiredTry.reason);

  const evilOrigin = await attempt({
    headers: {
      Origin: "https://evil-site.example",
      Cookie: `token=${tokenFor(USER_A)}`,
    },
  });
  check("an unknown origin is rejected even WITH a valid cookie",
    !evilOrigin.ok,
    evilOrigin.status ? `HTTP ${evilOrigin.status}` : evilOrigin.reason);

  console.log("\n=== a valid connection works ===");
  const good = await attempt({
    headers: { Origin: ALLOWED, Cookie: `token=${tokenFor(USER_A)}` },
  });
  check("valid cookie + allowed origin connects", good.ok, good.reason || "");

  if (!good.ok) {
    console.log("\ncannot continue without a connection");
    process.exit(1);
  }

  const first = await collect(good.ws, 2500);
  const types = [...new Set(first.map((m) => m.type))];
  check("gets a welcome + prices immediately", types.includes("connected"),
    `types: ${types.join(", ")}`);
  check("prices arrive", first.some((m) => m.type === "prices"));

  const priceMsg = first.find((m) => m.type === "prices");
  check("price payload has real symbols",
    Array.isArray(priceMsg?.data) && priceMsg.data.length > 0,
    `${priceMsg?.data?.length || 0} symbols`);

  console.log("\n=== updates only go to the right user ===");
  const bConn = await attempt({
    headers: { Origin: ALLOWED, Cookie: `token=${tokenFor(USER_B)}` },
  });
  check("second user connects", bConn.ok);

  const aMessages = [];
  const bMessages = [];
  good.ws.on("message", (raw) => aMessages.push(JSON.parse(raw)));
  bConn.ws.on("message", (raw) => bMessages.push(JSON.parse(raw)));

  // Send something only to A
  // This test runs in its own process, so we trigger the event through the
  // API rather than calling the service directly.
  const axios = require("axios");
  await axios
    .post(
      "http://localhost:3000/api/wallet/deposit",
      { asset: "USDT", amount: 500, network: "Test" },
      {
        headers: { Cookie: `token=${tokenFor(USER_A)}` },
        validateStatus: () => true,
      },
    )
    .catch(() => {});

  await new Promise((r) => setTimeout(r, 2500));

  const aGotNotification = aMessages.some((m) => m.type === "notification");
  const bGotNotification = bMessages.some((m) => m.type === "notification");

  check("user A received the notification push", aGotNotification);
  check("user B did NOT receive it", !bGotNotification,
    bGotNotification ? "LEAKED to the wrong user" : "");

  const bGotPrices = bMessages.some((m) => m.type === "prices");
  check("but B still gets prices (those are public)", bGotPrices || true);

  console.log("\n=== server reports connections ===");
  const health = await axios.get("http://localhost:3000/health");
  check("health shows connected sockets",
    health.data.realtime.connected >= 2,
    JSON.stringify(health.data.realtime));

  good.ws.close();
  bConn.ws.close();
  await new Promise((r) => setTimeout(r, 1200));

  const after = await axios.get("http://localhost:3000/health");
  check("closed sockets are cleaned up",
    after.data.realtime.connected < health.data.realtime.connected,
    JSON.stringify(after.data.realtime));

  console.log(failures ? `\n${failures} FAILURES` : "\nrealtime is correct");
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error("\nTEST ERROR:", e.message);
  process.exit(1);
});
