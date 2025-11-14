# 👨‍💻 Collaborative Code Editor

A real-time collaborative code editor built with **React, Node.js, Express, MongoDB, Socket.io, and Piston api**.  
This project allows multiple users to join a shared room, write code together, chat, and run code in various programming languages piston api.

---

## ✨ Features

- 🔗 **Real-time collaboration** with [Socket.io](https://socket.io/)  
- 📝 **Multi-language support**: JavaScript, Python, Java, C, C++, Go  
- 📡 **Live chat** within rooms  
- 👥 **Multiple users** can collaborate to code by joining the room.
- 📂 **Room persistence** with MongoDB (stores chat history)  
- ▶️ **Code execution** using piston api  
- 🖥️ **Web-based UI** using React  

---

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- Axios
- Socket.io-client
- monaco editor 
- YJS, y-websocket, y-monaco

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Socket.io-server
- Piston api (for code execution)
---

## ⚙️ Requirements

- Node.js >= 18  
- MongoDB (local or Atlas)  

---

▶️ Running Code in Docker

The backend runs user-submitted code in Docker containers.

Supported languages:

JavaScript → node:18
Python → python:3.10
Java → openjdk:17
C++ / C → gcc:latest
Go -> 1.16


🚀 Future Improvements

Add authentication (JWT / OAuth)

Support more programming languages

Add file sharing / multiple files per room

Deploy on cloud (Render, Vercel, etc.)
