// import { useEffect, useRef, useState } from "react"
// import Editor from "@monaco-editor/react"

// export default function CodeEditor({ roomId, socket, initialValue, language }) {
//   const editorRef = useRef(null)

//   function handleEditorDidMount(editor) {
//     editorRef.current = editor

//     // Send code changes
//     editor.onDidChangeModelContent(() => { 
//       const code = editor.getValue()
//       socket.emit("code-change", { roomId, code, language }) 
//     })
//   }

//   // Listen for code changes from server
//   useEffect(() => {
//     if (!socket) return
//     socket.on("code-change", ({ code }) => {
//       if (editorRef.current && code !== editorRef.current.getValue()) {
//         editorRef.current.setValue(code)
//       }
//     })
//     return () => socket.off("code-change")
//   }, [socket])

//   return (
//     <div className="flex-1 h-full">
//       <Editor
//         height="100%"
//         width="100%"
//         language={language || "javascript"}
//         defaultValue={initialValue || ""}   // ✅ only set once
//         onMount={handleEditorDidMount}
//         theme="vs-dark"
//         options={{
//           automaticLayout: true,
//           minimap: { enabled: false },
//         }}
//       />
//     </div>
//   )
// }


// src/components/CodeEditor.jsx
import { useEffect, useState } from "react"

export default function CodeEditor({ roomId, socket, initialValue, language }) {
  const [text, setText] = useState(initialValue || "")

  // Sync local edits to others
  const handleChange = (e) => {
    const newText = e.target.value
    setText(newText)
    socket.emit("code-change", { roomId, code: newText, language })
  }

  // Listen for remote updates
  useEffect(() => {
    if (!socket) return
    socket.on("code-change", ({ code }) => {
      setText(code)
    })
    return () => socket.off("code-change")
  }, [socket])

  return (
    <textarea
      value={text}
      onChange={handleChange}
      className="w-full h-full p-2 font-mono text-sm bg-gray-900 text-white resize-none outline-none"
      spellCheck="false"
    />
  )
}
