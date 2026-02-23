require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. DATABASE CONNECTION ---
mongoose.set('debug', true); 
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ DATABASE CONNECTED SUCCESSFULLY"))
  .catch((err) => {
    console.error("❌ DATABASE CONNECTION ERROR:", err.message);
  });

// --- 2. MESSAGE SCHEMA ---
const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  text: { type: String, required: true },
  time: { type: String, required: true },
  read: { type: Boolean, default: false }, // <--- Add this
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// --- 3. TRACKING ONLINE USERS ---
const onlineUsers = new Map(); // Stores userId -> socketId

// --- 4. API ENDPOINTS ---

// Home Route
app.get('/', (req, res) => {
  res.send('🚀 Mason Shop Chat Server is live!');
});

// Fetch History
app.get('/api/messages/:roomId', async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    // 1. Find all unique rooms for this user
    const rooms = await Message.find({ roomId: new RegExp(userId) }).distinct('roomId');

    // 2. For each room, count messages where sender is NOT the current user AND read is false
    const chatList = await Promise.all(rooms.map(async (roomId) => {
      const unreadCount = await Message.countDocuments({
        roomId: roomId,
        senderId: { $ne: userId }, // Message from the other person
        read: false
      });
      return { roomId, unreadCount };
    }));

    res.json(chatList);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chat list" });
  }
});


app.put('/api/messages/read/:roomId/:userId', async (req, res) => {
  try {
    // Mark messages as read if the current user is NOT the sender
    await Message.updateMany(
      { roomId: req.params.roomId, senderId: { $ne: req.params.userId }, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});


// Get total unread count for the whole app
app.get('/api/unread-total/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const count = await Message.countDocuments({
      roomId: new RegExp(userId),
      senderId: { $ne: userId },
      read: { $ne: true }
    });
    res.json({ totalUnread: count });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Status Check Route
app.get('/api/status/:userId', (req, res) => {
  const isOnline = onlineUsers.has(req.params.userId);
  res.json({ status: isOnline ? "online" : "offline" });
});

// --- 5. SOCKET.IO REAL-TIME LOGIC ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ['websocket']
});

io.on("connection", (socket) => {
  console.log("New User Connected:", socket.id);

  // When a user signals they are online
  socket.on("user_online", (userId) => {
    socket.userId = userId; // Store ID on socket for cleanup later
    onlineUsers.set(userId, socket.id);
    
    // Broadcast to everyone that this user is now online
    io.emit("status_update", { userId: userId, status: "online" });
    console.log(`User ${userId} is now Online`);
  });

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  // Inside server.js
socket.on("send_message", async (data) => {
  try {
    const newMessage = new Message({
      roomId: data.roomId,
      senderId: data.senderId,
      text: data.text,
      time: data.time,
      
    });
    
    const savedMsg = await newMessage.save(); // This creates the real _id

    // Send the REAL saved message back to the room
    io.to(data.roomId).emit("receive_message", savedMsg);
  } catch (err) {
    console.error(err);
  }
});

  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      // Broadcast that this user went offline
      io.emit("status_update", { userId: socket.userId, status: "offline" });
      console.log(`User ${socket.userId} went Offline`);
    }
  });
});

// --- 6. START SERVER ---
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server live on port ${PORT}`);
});