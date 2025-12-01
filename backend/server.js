import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://your-frontend-domain.com",
    ],
    credentials: true,
  })
);
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ---------------- Mongo Models ----------------
// const roomSchema = new mongoose.Schema({
//   roomId: { type: String, unique: true },
//   language: { type: String, default: "javascript" },
//   updatedAt: { type: Date, default: Date.now },
// });
// const Room = mongoose.model("Room", roomSchema);

const messageSchema = new mongoose.Schema({
  roomId: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
  meta: { socketId: String, user: String },
});
const Message = mongoose.model("Message", messageSchema);

import { execSync } from "child_process";

function isDockerRunning() {
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
}

// ---------------- Socket.io Events ----------------
const users = {}; // socket.id -> { name, roomId }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", async ({ roomId, name }) => {
    socket.join(roomId);
    users[socket.id] = { name: name || "Anonymous", roomId };

    // ✅ Load last 50 messages only
    const recentMsgs = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .limit(50);
    socket.emit("recent-messages", { messages: recentMsgs.reverse() });

    // ✅ Update connected user list
    const roomUsers = Object.entries(users)
      .filter(([_, u]) => u.roomId === roomId)
      .map(([id, u]) => ({ id, name: u.name }));
    io.to(roomId).emit("room-users", roomUsers);
  });

  socket.on("chat-message", async ({ roomId, message }) => {
    if (!roomId || !message) return;
    const msgDoc = await Message.create({
      roomId,
      text: message.text,
      meta: {
        socketId: socket.id,
        user: users[socket.id]?.name || "Anonymous",
      },
    });
    io.to(roomId).emit("chat-message", msgDoc);
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      delete users[socket.id];
      const roomUsers = Object.entries(users)
        .filter(([_, u]) => u.roomId === user.roomId)
        .map(([id, u]) => ({ id, name: u.name }));
      io.to(user.roomId).emit("room-users", roomUsers);
    }
    console.log("User disconnected:", socket.id);
  });
});

// ---------------- Code Execution API ----------------
// const LANGUAGE_CONFIG = {
//   javascript: { image: "node:18", file: "main.js", cmd: "node main.js" },
//   python: { image: "python:3.10", file: "main.py", cmd: "python main.py" },
//   java: {
//     image: "openjdk:17",
//     file: "Main.java",
//     cmd: "javac Main.java && java Main",
//   },
//   cpp: {
//     image: "gcc:latest",
//     file: "main.cpp",
//     cmd: "g++ main.cpp -o main && ./main",
//   },
//   c: {
//     image: "gcc:latest",
//     file: "main.c",
//     cmd: "gcc main.c -o main && ./main",
//   },
//   go: { image: "golang:latest", file: "main.go", cmd: "go run main.go" },
// };

// app.post("/api/run", (req, res) => {
//   if (!isDockerRunning()) {
//     return res.status(500).json({
//       error:
//         "❌ Docker is not running. Start Docker Desktop to run code safely.",
//     });
//   }
//   const { code, language } = req.body;
//   if (!code || !language)
//     return res.status(400).json({ error: "Missing code or language" });

//   const config = LANGUAGE_CONFIG[language];
//   if (!config) return res.status(400).json({ error: "Unsupported language" });

//   const tempDir = path.join("/tmp/code-execution", uuidv4());
//   fs.mkdirSync(tempDir, { recursive: true });
//   const filePath = path.join(tempDir, config.file);
//   fs.writeFileSync(filePath, code);

//   const dockerCmd = `docker run --rm -m 512m --cpus="0.5" -v "${tempDir}:/app" -w /app ${config.image} sh -c "${config.cmd}"`;

//   exec(dockerCmd, { timeout: 5000 }, (err, stdout, stderr) => {
//     if (err) {
//       // DO NOT FALL BACK TO local execution
//       return res.status(500).json({
//         output:
//           "❌ Docker execution failed.\nLocal execution is blocked for safety.\n\n" +
//           (stderr || err.message),
//       });
//     }

//     res.json({ output: stdout || stderr });
//   });
// });

import axios from "axios";

const LANGUAGE_CONFIG = {
  javascript: { language: "javascript", version: "18.15.0" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "cpp", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
  go: { language: "go", version: "1.16.2" }
};

app.post("/api/run", async (req, res) => {
  const { code, language, input } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "Missing code or language" });
  }

  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  try {
    const response = await axios.post(
      "https://emkc.org/api/v2/piston/execute",
      {
        language: config.language,
        version: config.version,
        files: [{ content: code }],
        stdin: input ?? ""
      },
      { timeout: 10000 }
    );

    const result = response.data;

    if (result.run) {
      const output =
        result.run.output || result.run.stderr || "No output from program";
      res.json({ output: output.trim() });
    } else {
      res.status(500).json({ output: "Execution failed" });
    }
  } catch (err) {
    console.error("Piston API Error:", err);

    if (err.code === "ECONNABORTED") {
      res.status(500).json({ output: "Execution timed out" });
    } else {
      res.status(500).json({
        output: "Piston API is unavailable. Try again later."
      });
    }
  }
});


// ---------------- Mongo Connection ----------------
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/codeeditor";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(PORT, () =>
      console.log(`🚀 Express + Socket.io running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("MongoDB error:", err));