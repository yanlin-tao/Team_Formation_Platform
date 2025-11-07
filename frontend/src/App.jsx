import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import EntryPage from './pages/EntryPage'
import PostPage from './pages/PostPage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/posts/:postId" element={<PostPage />} />
      </Routes>
    </Router>
  )
}

export default App

