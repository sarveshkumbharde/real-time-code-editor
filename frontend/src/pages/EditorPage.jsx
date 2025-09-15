import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useMemo } from "react"
import io from "socket.io-client"
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

  useEffect(() => {
    if (!roomId) return

    socket.emit("join-room", { roomId, name })

    socket.on("load-code", ({ code, language: lang }) => {
      setInitialCode(code || "")
      setLanguage(lang || "javascript")
    })

    return () => {
      socket.disconnect()
    }
  }, [socket, roomId, name])

  const leaveRoom = () => {
    socket.disconnect()
    navigate("/")
  }

  if (!roomId) {
    return <div className="p-4 text-red-500">❌ No room ID</div>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Editor + Top Bar */}
      <div className="flex-1 flex flex-col">
        {/* Room ID + Controls */}
        <div className="p-2 bg-gray-100 border-b flex items-center justify-between">
          <div>
            Room ID: <span className="text-blue-600">{roomId}</span>
            <button
              onClick={() => navigator.clipboard.writeText(roomId)}
              className="ml-2 bg-blue-500 text-white px-2 py-1 rounded text-sm"
            >
              Copy
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border px-2 py-1 rounded"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="typescript">TypeScript</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>

            <button
              onClick={leaveRoom}
              className="bg-red-500 text-white px-2 py-1 rounded text-sm"
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 h-full">
          <CodeEditor
            roomId={roomId}
            socket={socket}
            initialValue={initialCode}
            language={language}
          /> 
        </div>
      </div>

      {/* Chat + Users */}
      <div className="w-80 flex flex-col border-l">
        <ChatBox roomId={roomId} socket={socket} name={name} />
        <UserList socket={socket} />
      </div>
    </div>
  )
}