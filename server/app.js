const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

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

// Rate limiting — auth routes: 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests, please try again later." },
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
