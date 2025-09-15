import express from "express"
import http from "http"
import { Server } from "socket.io"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

// ---------------- Models ----------------
const roomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true },
  code: String,
  language: { type: String, default: "javascript" },
  updatedAt: { type: Date, default: Date.now },
})
const Room = mongoose.model("Room", roomSchema)

const messageSchema = new mongoose.Schema({
  roomId: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
  meta: {
    socketId: String,
    user: String,
  },
})
const Message = mongoose.model("Message", messageSchema)

// ---------------- Server Setup ----------------
const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*", // set to frontend URL in production
    methods: ["GET", "POST"],
  },
})

// ---------------- User Tracking ----------------
const users = {} // socket.id -> { name, roomId }

// ---------------- Socket.io Events ----------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Join room with name
  socket.on("join-room", async ({ roomId, name }) => {
    socket.join(roomId)
    users[socket.id] = { name: name || "Anonymous", roomId }

    // Ensure room exists
    let room = await Room.findOne({ roomId })
    if (!room) {
      room = await Room.create({ roomId, code: "", language: "javascript" })
    }

    // Send current code
    socket.emit("load-code", { code: room.code, language: room.language })

    // Send recent messages
    const recentMsgs = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .limit(50)
    socket.emit("recent-messages", { messages: recentMsgs.reverse() })

    // Update room users list
    const roomUsers = Object.entries(users) //turns into an array of key value pairs
      .filter(([_, u]) => u.roomId === roomId)
      .map(([id, u]) => ({ id, name: u.name }))
    io.to(roomId).emit("room-users", roomUsers)
  })

  // Handle code changes
  socket.on("code-change", async ({ roomId, code }) => {
    if (!roomId) return
    socket.to(roomId).emit("code-change", { code })

    // Save latest code
    await Room.findOneAndUpdate(
      { roomId },
      { code, updatedAt: new Date() },
      { upsert: true }  //if no document matches the filter, create a new one with the update data.
    )
  })

  // Handle chat messages
  socket.on("chat-message", async ({ roomId, message }) => {
    if (!roomId || !message) return
    const msgDoc = await Message.create({
      roomId,
      text: message.text,
      createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
      meta: { socketId: socket.id, user: users[socket.id]?.name || "Anonymous" },
    })

    io.to(roomId).emit("chat-message", {
      _id: msgDoc._id,
      text: msgDoc.text,
      createdAt: msgDoc.createdAt,
      meta: msgDoc.meta,
    })
  })

  // Handle cursor updates
  socket.on("cursor-update", ({ roomId, position, selection }) => {
    const name = users[socket.id]?.name || "Anonymous"
    socket.to(roomId).emit("cursor-update", {
      userId: socket.id,
      name,
      position,
      selection,
    })
  })

  // Disconnect
  socket.on("disconnect", () => {
    const user = users[socket.id]
    if (user) {
      delete users[socket.id]
      const roomUsers = Object.entries(users)
        .filter(([_, u]) => u.roomId === user.roomId)
        .map(([id, u]) => ({ id, name: u.name }))
      io.to(user.roomId).emit("room-users", roomUsers)
    }
    console.log("User disconnected:", socket.id)
  })
})

// ---------------- REST Endpoints ----------------
app.get("/api/rooms/:roomId", async (req, res) => {
  const { roomId } = req.params
  const room = await Room.findOne({ roomId })
  if (!room) return res.status(404).json({ error: "Room not found" })
  res.json(room)
})

// app.get("/api/health", (req, res) => {
//   res.json({ status: "ok" })
// })

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/codeeditor"

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected")
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
  })
  .catch((err) => console.error("MongoDB connection error:", err))
