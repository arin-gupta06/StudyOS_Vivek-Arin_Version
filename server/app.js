const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("./config/redis");
const compression = require("compression");

const app = express();

// Enable gzip compression for better performance
app.use(compression());

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:5174"];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
};

// Security headers
app.use(helmet());

// Handle OPTIONS preflight for all routes before rate limiting
app.options("/{*path}", cors(corsOptions));

// Helper to create rate limit Redis stores with unique prefixes
const createRateLimitStore = (prefix) => {
  if (redisClient) {
    return new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: prefix,
    });
  }
  return undefined;
};

// Global API rate limiting
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per `window`
  message: { message: "Too many requests from this IP, please try again after a minute." },
  store: createRateLimitStore("rl:global:"),
  standardHeaders: true,
  legacyHeaders: false,
});
// Apply global limiter to all routes except large files uploads if needed
app.use("/api", globalLimiter);

// Rate limiting â€” auth routes: 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests, please try again later." },
  store: createRateLimitStore("rl:auth:"),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Middleware — keep 10mb for sketch/image uploads, 1mb elsewhere
app.use((req, res, next) => {
  if (req.path.startsWith("/api/sketches") || req.path.startsWith("/api/local-save")) {
    express.json({ limit: "10mb" })(req, res, next);
  } else {
    express.json({ limit: "1mb" })(req, res, next);
  }
});
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/subjects", require("./routes/subjects"));
app.use("/api/events", require("./routes/events"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/notebooks", require("./routes/notebooks"));
app.use("/api/calculator", require("./routes/calculator"));
app.use("/api/sketches", require("./routes/sketches"));
app.use("/api/focus", require("./routes/focus"));
app.use("/api/local-save", require("./routes/localsave"));

app.get("/", (req, res) => {
  res.send("StudyOS API is running...");
});

module.exports = app;
