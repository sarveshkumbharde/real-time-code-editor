// src/pages/EditorPage.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import CodeEditor from "../components/CodeEditor";
import ChatBox from "../components/ChatBox";
import UserList from "../components/UserList";
import { jsPDF } from "jspdf";
import {
  FiCopy,
  FiDownload,
  FiMaximize,
  FiMinimize,
  FiPlay,
  FiLogOut,
  FiX,
} from "react-icons/fi";

export default function EditorPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const name = searchParams.get("name") || "Guest";
  const navigate = useNavigate();

  const socket = useMemo(() => io(import.meta.env.VITE_SOCKET_SERVER_URL), []);
  const editorRef = useRef(null);

  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // fullscreen overlay flags
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const [outputFullscreen, setOutputFullscreen] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    socket.emit("join-room", { roomId, name });
    return () => socket.disconnect();
  }, [socket, roomId, name]);

  const runCode = async () => {
    const code = editorRef.current?.getValue();
    if (!code) return alert("No code to run!");
    setIsRunning(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SOCKET_SERVER_URL}/api/run`,
        { code, language },
        { headers: { "Content-Type": "application/json" } }
      );
      setOutput(data.output);
    } catch (err) {
      console.error(err);
      setOutput("❌ Error running code");
    } finally {
      setIsRunning(false);
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      alert("✅ Room ID copied to clipboard!");
    } catch {
      alert("Could not copy room ID.");
    }
  };

  const downloadCodeAsPDF = () => {
    const code = editorRef.current?.getValue();
    if (!code) return alert("No code to download!");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const margin = 40;
    const maxWidth = pdf.internal.pageSize.width - margin * 2;
    const textLines = pdf.splitTextToSize(code, maxWidth);
    pdf.setFont("Courier", "normal");
    pdf.setFontSize(10);
    pdf.text(textLines, margin, margin);
    pdf.save(`room-${roomId}.pdf`);
  };

  const leaveRoom = () => {
    socket.disconnect();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 overflow-hidden">
      {/* Main Column */}
      <div className="flex flex-col flex-1">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b bg-white px-4 py-2 shadow-sm z-10">
          <div className="flex items-center gap-3">
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
              disabled={isRunning}
              className={`flex items-center gap-2 ${
                isRunning ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
              } text-white px-3 py-1 rounded`}
            >
              <FiPlay /> {isRunning ? "Running..." : "Run"}
            </button>

            <button
              onClick={copyRoomId}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            >
              <FiCopy /> Copy Room ID
            </button>

            <button
              onClick={downloadCodeAsPDF}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded"
            >
              <FiDownload /> Download PDF
            </button>

            <button
              onClick={() => setEditorFullscreen(true)}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded"
              title="Open editor fullscreen"
            >
              <FiMaximize /> Editor Fullscreen
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* <button
              onClick={() => setOutputFullscreen(true)}
              className="flex items-center gap-2 bg-black text-white px-3 py-1 rounded"
              title="Open output fullscreen"
            >
              <FiMaximize /> Output Fullscreen
            </button> */}

            <button
              onClick={leaveRoom}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            >
              <FiLogOut /> Leave
            </button>
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <CodeEditor
              roomId={roomId}
              language={language}
              editorRef={editorRef}
              // ensure container uses full height
            />
          </div>
        </div>

        {/* Output strip (not fullscreen) */}
        <div className="h-[28vh] border-t bg-black text-white p-4 overflow-auto">
          <div className="flex justify-between items-start mb-2">
            <h2 className="font-semibold text-lg text-green-400">Output</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setOutputFullscreen(true)}
                className="bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded text-white flex items-center gap-2"
              >
                <FiMaximize /> Fullscreen
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap text-sm">{output}</pre>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-96 border-l flex flex-col bg-white">
        <ChatBox roomId={roomId} socket={socket} name={name} />
        <UserList socket={socket} />
      </div>

      {/* Editor Fullscreen Overlay */}
      {editorFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-3">
              <strong>Editor — Room: {roomId}</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditorFullscreen(false)}
                className="bg-gray-700 text-white px-3 py-1 rounded flex items-center gap-2"
              >
                <FiMinimize /> Close
              </button>
            </div>
          </div>
          <div className="flex-1">
            {/* Editor in full viewport; pass same editorRef */}
            <CodeEditor
              roomId={roomId}
              language={language}
              editorRef={editorRef}
            />
          </div>
        </div>
      )}

      {/* Output Fullscreen Overlay */}
      {outputFullscreen && (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-green-400">Output — Room: {roomId}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOutputFullscreen(false)}
                className="bg-gray-700 text-white px-3 py-1 rounded flex items-center gap-2"
              >
                <FiMinimize /> Close
              </button>
            </div>
          </div>
          <div className="flex-1 p-6 overflow-auto">
            <pre className="whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
