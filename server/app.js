const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:5174"];

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

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
