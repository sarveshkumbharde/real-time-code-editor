import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import EditorPage from "./pages/EditorPage"

function App() {
  return (

    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:roomId" element={<EditorPage />} />
        <Route path="/room/:roomId" element={<EditorPage />} /> {/* ✅ extra */}
      </Routes>
    </Router>
  )
}

export default App
