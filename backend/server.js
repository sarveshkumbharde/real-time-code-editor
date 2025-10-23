import express from "express"
import http from "http"
import { Server } from "socket.io"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import { exec } from "child_process"
import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

dotenv.config()

// ---------------- Mongo Models ----------------
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
app.use(cors({origin: [
    'https://real-time-code-editor-bc86.vercel.app/', // Add your Vercel URL later
    'http://localhost:3000',
    'http://localhost:5173' // Vite default port
  ],
  credentials: true}))
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

// ---------------- User Tracking ----------------
const users = {} // socket.id -> { name, roomId }

// ---------------- Socket.io Events ----------------
io.on("connection", (socket) => {  console.log("User connected:", socket.id)

  // Join room
  socket.on("join-room", async ({ roomId, name }) => {
    socket.join(roomId) //user joins room with roomId
    users[socket.id] = { name: name || "Anonymous", roomId }

    // Ensure room exists
    let room = await Room.findOne({ roomId })
    if (!room) {
      room = await Room.create({ roomId, code: "", language: "javascript" })
    }

    // Send current code
    socket.emit("load-code", { code: room.code, language: room.language })

    // Send recent messages (last 50)
    const recentMsgs = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .limit(50)
    socket.emit("recent-messages", { messages: recentMsgs.reverse() })

    // Update room users
    const roomUsers = Object.entries(users)
      .filter(([_, u]) => u.roomId === roomId)
      .map(([id, u]) => ({ id, name: u.name }))
    io.to(roomId).emit("room-users", roomUsers)
  })

  // Code changes
  socket.on("code-change", async ({ roomId, code, language }) => {
    if (!roomId) return
    socket.to(roomId).emit("code-change", { code, language })

    await Room.findOneAndUpdate(
      { roomId },
      { code, language, updatedAt: new Date() },
      { upsert: true }
    )
  })

  // Chat messages
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

// ---------------- Code Execution (Docker) ----------------
const LANGUAGE_CONFIG = {
  javascript: { image: "node:18", file: "main.js", cmd: "node main.js" },
  python: { image: "python:3.10", file: "main.py", cmd: "python main.py" },
  java: { image: "openjdk:17", file: "Main.java", cmd: "javac Main.java && java Main" },
  cpp: { image: "gcc:latest", file: "main.cpp", cmd: "g++ main.cpp -o main && ./main" },
  c: { image: "gcc:latest", file: "main.c", cmd: "gcc main.c -o main && ./main" },
  go: { image: "golang:latest", file: "main.go", cmd: "go run main.go" },
}

app.post("/api/run", (req, res) => {
  const { code, language } = req.body

  if (!code || !language) {
    return res.status(400).json({ error: "Missing code or language" })
  }

  const config = LANGUAGE_CONFIG[language]
  if (!config) return res.status(400).json({ error: "Unsupported language" })

  const tempDir = path.join("C:/Users/Sarvesh Kumbharde/Desktop/Code-editor/temp", uuidv4())
  fs.mkdirSync(tempDir, { recursive: true })

  const filePath = path.join(tempDir, config.file)
  fs.writeFileSync(filePath, code)

const dockerCmd = `docker run --rm -m 512m --cpus="0.5" -v "${tempDir}:/app" -w /app ${config.image} sh -c "${config.cmd}"`

  exec(dockerCmd, { timeout: 5000 }, (err, stdout, stderr) => {
    fs.rmSync(tempDir, { recursive: true, force: true })

    if (err) {
      console.error("Docker execution error:", err)
      return res.status(500).json({ output: stderr || err.message })
    }

    res.json({ output: stdout || stderr })
  })
})

// ---------------- REST API ----------------
app.get("/api/rooms/:roomId", async (req, res) => {
  const { roomId } = req.params
  const room = await Room.findOne({ roomId })
  if (!room) return res.status(404).json({ error: "Room not found" })
  res.json(room)
})

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/codeeditor"

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected")
    server.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    )
  })
  .catch((err) => console.error("MongoDB connection error:", err))