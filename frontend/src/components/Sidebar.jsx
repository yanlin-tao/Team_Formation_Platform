import React from 'react'
import { Link } from 'react-router-dom'
import './Sidebar.css'

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>TeamUp</h2>
      </div>
      <nav className="sidebar-nav">
        <Link to="/" className="nav-item">
          <span className="nav-icon">🏠</span>
          <span>Home</span>
        </Link>
        <Link to="/" className="nav-item">
          <span className="nav-icon">🔔</span>
          <span>Notifications</span>
        </Link>
        <Link to="/" className="nav-item">
          <span className="nav-icon">🔍</span>
          <span>Search</span>
        </Link>
        <Link to="/" className="nav-item">
          <span className="nav-icon">💬</span>
          <span>Messages</span>
        </Link>
        <Link to="/" className="nav-item">
          <span className="nav-icon">📚</span>
          <span>My Courses</span>
        </Link>
        <Link to="/" className="nav-item">
          <span className="nav-icon">👥</span>
          <span>My Teams</span>
        </Link>
      </nav>
    </div>
  )
}

export default Sidebar

