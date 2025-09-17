import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import io from "socket.io-client"
import axios from "axios"
import CodeEditor from "../components/CodeEditor"
import ChatBox from "../components/ChatBox"
import UserList from "../components/UserList"

export default function EditorPage() {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const name = searchParams.get("name") || "Guest"
  const navigate = useNavigate()

  const socket = useMemo(() => io(import.meta.env.VITE_SOCKET_SERVER_URL), [])
  const [initialCode, setInitialCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [output, setOutput] = useState("")

  const editorRef = useRef(null) // Ref for current code in Monaco

  useEffect(() => {
    if (!roomId) return

    socket.emit("join-room", { roomId, name })

    socket.on("load-code", ({ code, language: lang }) => {
      setInitialCode(code || "")
      setLanguage(lang || "javascript")
    })

    return () => socket.disconnect()
  }, [socket, roomId, name])

  const runCode = async () => {
    if (!editorRef.current) return
    const code = editorRef.current.getValue() // ✅ get current code
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/run",
        { code, language },
        { headers: { "Content-Type": "application/json" } }
      )
      setOutput(data.output)
    } catch (err) {
      console.error(err)
      setOutput("❌ Error running code")
    }
  }

  const leaveRoom = () => {
    socket.disconnect()
    navigate("/")
  }

  return (
    <div className="flex h-screen">
      {/* Left side: Editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-4 p-2 border-b">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="go">Go</option>
          </select>
          <button
            onClick={runCode}
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            Run Code
          </button>
          <button
            onClick={leaveRoom}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Leave Room
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <CodeEditor
            roomId={roomId}
            socket={socket}
            initialValue={initialCode}
            language={language}
            editorRef={editorRef} // ✅ pass ref
          />
        </div>

        {/* Output */}
        <div className="h-32 border-t bg-black text-white p-2 overflow-auto">
          <pre>{output}</pre>
        </div>
      </div>

      {/* Right side: Chat + Users */}
      <div className="w-80 border-l flex flex-col">
        <ChatBox roomId={roomId} socket={socket} name={name} />
        <UserList socket={socket} />
      </div>
    </div>
  )
}
