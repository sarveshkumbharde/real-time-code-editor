import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const joinRoom = () => {
    if (!roomId || !name) return alert("Enter room ID and name");
    navigate(`/editor/${roomId}?name=${encodeURIComponent(name)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-3xl font-bold">Realtime Code Editor</h1>
      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border px-3 py-2 rounded w-64"
      />
      <input
        type="text"
        placeholder="Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="border px-3 py-2 rounded w-64"
      />
      <button
        onClick={joinRoom}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Join Room
      </button>
    </div>
  );
}


