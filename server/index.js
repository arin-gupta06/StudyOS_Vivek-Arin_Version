const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

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
  // Enable web-socket compression for heavy real-time data like sketches and calculations
  perMessageDeflate: {
    threshold: 1024, // Compress responses larger than 1KB
    zlibDeflateOptions: {
      chunkSize: 1024 * 8, // Increase minimum chunk size for faster processing 
    },
    zlibInflateOptions: {
      chunkSize: 1024 * 8,
    },
    clientNoContextTakeover: true, // Optimizes memory handling during high traffic
    serverNoContextTakeover: true, // Prevents Node's memory from bloating via context queues
  },
});

// Setup Redis Adapter for multi-core PM2 websocket scaling
if (process.env.REDIS_URI) {
  const pubClient = createClient({ url: process.env.REDIS_URI });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis Adapter attached to Socket.io for PM2 clustering");
  }).catch((err) => {
    console.error("Redis connection error:", err);
  });
} else {
  console.log("No REDIS_URI provided. Socket.io running in memory (Cluster state sync disabled).");
}
// Database Connection — start server only after DB is ready
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 100, // Keep multiple database stream connections open to allow concurrent requests
  })
  .then(() => {
    console.log("MongoDB Connected");
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      // Auto-Ping to prevent Render from sleeping on the free tier (every 14 mins)
      const VITE_API_URL = process.env.VITE_API_URL || `http://localhost:${PORT}`;
      setInterval(() => {
        http.get(`${VITE_API_URL}/`).on("error", (err) => {
          console.log("Keep-alive ping failed:", err.message);
        });
      }, 14 * 60 * 1000);
    });
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));

// ─── Socket.IO JWT authentication middleware ───
io.use((socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    // Fall back to httpOnly cookie sent via withCredentials
    if (!token && socket.handshake.headers.cookie) {
      const cookies = Object.fromEntries(
        socket.handshake.headers.cookie.split(";").map((c) => {
          const [k, ...v] = c.trim().split("=");
          return [k.trim(), decodeURIComponent(v.join("="))];
        }),
      );
      token = cookies.jwt;
    }

    if (!token) return next(new Error("Authentication required"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

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

  // --- WebRTC Video Study Room Events ---
  socket.on("join room", (roomID) => {
    if (socket.notebookId && socket.notebookId !== roomID) {
      socket.leave(socket.notebookId);
    }
    socket.join(roomID);
    socket.notebookId = roomID;
    
    // Get all other users currently in this room to establish peer connections
    const usersInThisRoom = Array.from(io.sockets.adapter.rooms.get(roomID) || []).filter(id => id !== socket.id);
    socket.emit("all users", usersInThisRoom);
  });

  socket.on("sending signal", payload => {
    io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
  });

  socket.on("returning signal", payload => {
    io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
  });

  socket.on("disconnect", () => {
    if (socket.notebookId) {
      const count = io.sockets.adapter.rooms.get(socket.notebookId)?.size || 0;
      io.to(socket.notebookId).emit("user-count", count);
    }
    console.log("Socket disconnected:", socket.id);
  });
});
