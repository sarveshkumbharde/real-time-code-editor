import { useEffect } from "react"
import Editor from "@monaco-editor/react"

export default function CodeEditor({ roomId, socket, initialValue, language, editorRef }) {

  function handleEditorDidMount(editor) {
    editorRef.current = editor

    // Send code changes to server
    editor.onDidChangeModelContent(() => {
      const code = editor.getValue()
      socket.emit("code-change", { roomId, code, language })
    })
  }

  useEffect(() => {
    if (!socket) return

    // Receive code changes from others
    socket.on("code-change", ({ code }) => {
      if (editorRef.current && code !== editorRef.current.getValue()) {
        const position = editorRef.current.getPosition() // save cursor
        editorRef.current.setValue(code)
        editorRef.current.setPosition(position) // restore cursor
      }
    })

    return () => socket.off("code-change")
  }, [socket])

  return (
    <div className="flex-1 h-full">
      <Editor
        height="100%"
        width="100%"
        language={language || "javascript"}
        defaultValue={initialValue || ""} // only initial load
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
        }}
      />
    </div>
  )
}
