const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// required all important
const connectDB = require("./config/connection");
const priceService = require("./services/priceService");
const executionEngine = require("./services/executionEngine");
const realtimeService = require("./services/realtimeService");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();

// Render/Vercel put the app behind a proxy. Without this, every request looks
// like it comes from the proxy IP, so rate limiting would throttle all users
// as one and req.ip would be useless for session records.
app.set("trust proxy", 1);

// USE CORS
const allowedOrigins = process.env.CLIENT_URL.split(",").map((origin) =>
  origin.trim(),
);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("Blocked Origin:", origin);
    return callback(new Error("CORS not allowed"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// A broad ceiling on the whole API. Auth endpoints get a much tighter one of
// their own below — brute-forcing a password is the attack that matters here.
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please slow down" },
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count toward the limit
  message: {
    success: false,
    message: "Too many login attempts, please try again later",
  },
});

// all routes
const userRoutes = require("./routes/user.routes");
const sessionRoutes = require("./routes/session.routes");
const marketRoutes = require("./routes/market.routes");
const walletRoutes = require("./routes/wallet.routes");
const orderRoutes = require("./routes/order.routes");
const portfolioRoutes = require("./routes/portfolio.routes");
const {
  notificationRouter,
  bankRouter,
  supportRouter,
  kycRouter,
} = require("./routes/account.routes");

// apis
app.use("/api/user/login", authLimiter);
app.use("/api/user/register", authLimiter);
app.use("/api/user", userRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/notifications", notificationRouter);
app.use("/api/bank-accounts", bankRouter);
app.use("/api/support", supportRouter);
app.use("/api/kyc", kycRouter);

connectDB(); // database connection add

app.get("/", (req, res) => {
  res.send("APIs Running...");
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    uptime: process.uptime(),
    priceFeed: priceService.isReady() ? "ready" : "warming up",
    realtime: realtimeService.stats(),
  });
});

// Must be last: 404 for unmatched routes, then the single error responder.
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Kept in a variable because the WebSocket server needs to share it — a
// socket upgrade arrives on the same port as a normal request.
const server = app.listen(PORT, () => {
  console.log(`Server is running port number ${PORT}`);

  // Started after listen so a slow or blocked upstream cannot delay the
  // server accepting requests. Endpoints report 503 until it warms up.
  priceService.start();

  // Watches open limit/stop orders and fills them when the price arrives.
  executionEngine.start();

  // Same origin list as CORS: WebSockets bypass CORS entirely, so the check
  // has to be repeated here or any site could open a socket with the users
  // cookie attached.
  realtimeService.start(server, allowedOrigins);
});
