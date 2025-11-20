import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import EntryPage from './pages/EntryPage'
import PostPage from './pages/PostPage'
import CreatePostPage from './pages/CreatePostPage'
import ProfilePage from './pages/ProfilePage'
import AuthPage from './pages/AuthPage'
import NotificationsPage from './pages/NotificationsPage'
import MessagesPage from './pages/MessagesPage'
import CoursesPage from './pages/CoursesPage'
import TeamsPage from './pages/TeamsPage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/posts/create" element={<CreatePostPage />} />
        <Route path="/posts/:postId" element={<PostPage />} />
      </Routes>
    </Router>
  )
}

export default App
