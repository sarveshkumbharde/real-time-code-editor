import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

export default function CodeEditor({ roomId, language, editorRef, initialValue }) {
  const providerRef = useRef(null);
  const ydocRef = useRef(null);
  const ytextRef = useRef(null);
  const bindingRef = useRef(null);

  // Create Yjs doc + provider ONCE
  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider("ws://localhost:1234", roomId, ydoc);

    providerRef.current = provider;
    ydocRef.current = ydoc;
    ytextRef.current = ydoc.getText("monaco");

    provider.on("status", (e) => console.log("Y-WebSocket:", e.status));

    return () => {
      provider.destroy();    // fully closes WS cleanly
      ydoc.destroy();
    };
  }, [roomId]);

  function handleEditorDidMount(editor) {
    if (editorRef) editorRef.current = editor;

    const model = editor.getModel();

    // Bind Monaco ↔ Yjs ONLY once
    if (!bindingRef.current) {
      bindingRef.current = new MonacoBinding(
        ytextRef.current,
        model,
        new Set([editor]),
        providerRef.current.awareness
      );
    }

    // Insert initial code ONLY on first load
    if (ytextRef.current.length === 0 && initialValue) {
      ytextRef.current.insert(0, initialValue);
    }
  }

  return (
    <Editor
      height="100%"
      width="100%"
      language={language}   // IMPORTANT: not defaultLanguage
      theme="vs-dark"
      onMount={handleEditorDidMount}
      options={{
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 16,
        quickSuggestions: false,
        semanticHighlighting: false,
      }}
    />
  );
}
