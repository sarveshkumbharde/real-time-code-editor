import { useEffect, useState } from "react"

export default function ChatBox({ socket, roomId, name }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")

  useEffect(() => {
    if (!socket) return

    socket.on("recent-messages", ({ messages }) => setMessages(messages))

    socket.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg])
    })

    return () => {
      socket.off("recent-messages")
      socket.off("chat-message")
    }
  }, [socket])

  const sendMessage = () => {
    if (!text.trim()) return
    const msg = { text, createdAt: new Date(), meta: { user: name } }
    socket.emit("chat-message", { roomId, message: msg })
    setText("")
  }

  return (
    <div className="flex flex-col flex-1 border-b">
      <div className="flex-1 overflow-y-auto p-2">
        {messages.map((m, i) => (
          <div key={m._id || i} className="mb-1">
            <strong>{m.meta?.user || "Anon"}:</strong> {m.text}
          </div>
        ))}
      </div>
      <div className="p-2 border-t flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border px-2 py-1 rounded"
          placeholder="Type message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Send
        </button>
      </div>
    </div>
  )
}
