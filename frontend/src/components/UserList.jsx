import { useEffect, useState } from "react"

export default function UserList({ socket }) {
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (!socket) return
    socket.on("room-users", (list) => setUsers(list))
    return () => socket.off("room-users")
  }, [socket])

  return (
    <div className="p-3 border-t bg-gray-50">
      <h3 className="font-semibold mb-2">Users</h3>
      <ul className="space-y-1">
        {users.map((u) => ( 
          <li key={u.id} className="text-sm">
            {u.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
