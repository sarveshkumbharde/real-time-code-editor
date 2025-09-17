# 👨‍💻 Collaborative Code Editor

A real-time collaborative code editor built with **React, Node.js, Express, MongoDB, Socket.io, and Docker**.  
This project allows multiple users to join a shared room, write code together, chat, and run code in various programming languages using Docker containers.

---

## ✨ Features

- 🔗 **Real-time collaboration** with [Socket.io](https://socket.io/)  
- 📝 **Multi-language support**: JavaScript, Python, Java, C, C++, Go  
- 📡 **Live chat** within rooms  
- 👥 **Multiple users** can join the same room  
- 📂 **Room persistence** with MongoDB (stores code, language, and chat history)  
- ▶️ **Code execution** inside Docker containers for safe sandboxing  
- 🖥️ **Web-based UI** using React  

---

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- Axios
- Socket.io-client

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Socket.io
- Docker (for code execution)

---

## 📂 Project Structure

Code-editor/
│
├── backend/ # Node.js + Express backend
│ ├── server.js # Main server file
│ ├── models/ # MongoDB schemas
│ └── package.json
│
├── frontend/ # React frontend
│ ├── src/
│ │ ├── components/ # Reusable UI components
│ │ ├── pages/ # EditorPage, HomePage, etc.
│ │ ├── App.jsx
│ │ └── main.jsx
│ └── package.json
│
├── temp/ # Temporary code execution files (auto-cleaned)
├── README.md # Documentation
└── .env # Environment variables


---

## ⚙️ Requirements

- Node.js >= 18  
- MongoDB (local or Atlas)  
- Docker Desktop (Windows/macOS) or Docker Engine (Linux)  
- WSL2 (if using Docker on Windows)  

---


▶️ Running Code in Docker

The backend runs user-submitted code in Docker containers.

Supported languages & Docker images:

JavaScript → node:18
Python → python:3.10
Java → openjdk:17
C++ / C → gcc:latest


🚀 Future Improvements

Add authentication (JWT / OAuth)

Support more programming languages

Add file sharing / multiple files per room

Deploy on cloud (Render, Railway, Vercel, etc.)
