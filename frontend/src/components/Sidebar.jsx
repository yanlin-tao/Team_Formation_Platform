import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  HiHome, 
  HiBell, 
  HiMagnifyingGlass, 
  HiChatBubbleLeftRight, 
  HiAcademicCap, 
  HiUserGroup 
} from 'react-icons/hi2'
import './Sidebar.css'

function Sidebar() {
  const location = useLocation()

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <HiUserGroup className="sidebar-logo-icon" />
          <h2>TeamUp</h2>
        </div>
      </div>
      <nav className="sidebar-nav">
        <Link 
          to="/" 
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          <HiHome className="nav-icon" />
          <span>Home</span>
        </Link>
        <Link 
          to="/notifications" 
          className={`nav-item ${location.pathname === '/notifications' ? 'active' : ''}`}
        >
          <HiBell className="nav-icon" />
          <span>Notifications</span>
        </Link>
        <Link 
          to="/search" 
          className={`nav-item ${location.pathname === '/search' ? 'active' : ''}`}
        >
          <HiMagnifyingGlass className="nav-icon" />
          <span>Search</span>
        </Link>
        <Link 
          to="/messages" 
          className={`nav-item ${location.pathname === '/messages' ? 'active' : ''}`}
        >
          <HiChatBubbleLeftRight className="nav-icon" />
          <span>Messages</span>
        </Link>
        <Link 
          to="/courses" 
          className={`nav-item ${location.pathname === '/courses' ? 'active' : ''}`}
        >
          <HiAcademicCap className="nav-icon" />
          <span>My Courses</span>
        </Link>
        <Link 
          to="/teams" 
          className={`nav-item ${location.pathname === '/teams' ? 'active' : ''}`}
        >
          <HiUserGroup className="nav-icon" />
          <span>My Teams</span>
        </Link>
      </nav>
    </div>
  )
}

export default Sidebar

