import { useEffect, useRef } from "react"
import Editor from "@monaco-editor/react"

export default function CodeEditor({ roomId, socket, initialValue, language, editorRef }) {
  const currentLanguageRef = useRef(language)

  // Update the ref when language changes
  useEffect(() => {
    currentLanguageRef.current = language
  }, [language])

  function handleEditorDidMount(editor) {
    editorRef.current = editor

    // Send code changes to server
    editor.onDidChangeModelContent(() => {
      const code = editor.getValue()
      // Use the ref to get the current language
      socket.emit("code-change", { 
        roomId, 
        code, 
        language: currentLanguageRef.current 
      })
    })
  }

  useEffect(() => {
    if (!socket) return

    // Receive code changes from others
    socket.on("code-change", ({ code, language: incomingLanguage }) => {
      if (editorRef.current && code !== editorRef.current.getValue()) {
        const position = editorRef.current.getPosition()
        editorRef.current.setValue(code)
        editorRef.current.setPosition(position)
        
        // Optional: Update language if different
        if (incomingLanguage && incomingLanguage !== currentLanguageRef.current) {
          currentLanguageRef.current = incomingLanguage
        }
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
        value={initialValue || ""} // Use value instead of defaultValue
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
