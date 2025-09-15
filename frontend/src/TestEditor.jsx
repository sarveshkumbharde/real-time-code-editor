import Editor from "@monaco-editor/react"

export default function TestEditor() {
  return (
    <div style={{ height: "90vh", width: "100%" }}>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        defaultValue="// If you see this, Monaco works ✅"
        theme="vs-dark"
      />
    </div>
  )
}
