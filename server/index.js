const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = require("./app");
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:5174"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Database Connection
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// ─── Socket.IO for real-time notebook collaboration ───
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-notebook", (notebookId) => {
    // Leave any previous notebook room
    if (socket.notebookId) {
      socket.leave(socket.notebookId);
    }
    socket.join(notebookId);
    socket.notebookId = notebookId;
    const count = io.sockets.adapter.rooms.get(notebookId)?.size || 0;
    io.to(notebookId).emit("user-count", count);
    console.log(`User joined notebook ${notebookId} (${count} users)`);
  });

  socket.on("leave-notebook", (notebookId) => {
    socket.leave(notebookId);
    socket.notebookId = null;
    const count = io.sockets.adapter.rooms.get(notebookId)?.size || 0;
    io.to(notebookId).emit("user-count", count);
  });

  // Broadcast content changes to everyone else in the room
  socket.on("notebook-update", ({ notebookId, title, blocks, tags }) => {
    socket.to(notebookId).emit("notebook-changed", { title, blocks, tags });
  });

  socket.on("disconnect", () => {
    if (socket.notebookId) {
      const count = io.sockets.adapter.rooms.get(socket.notebookId)?.size || 0;
      io.to(socket.notebookId).emit("user-count", count);
    }
    console.log("Socket disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
