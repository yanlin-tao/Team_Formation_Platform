import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { fetchUserMatchRequests } from '../services/api'
import './DashboardPages.css'

function NotificationsPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const [matchRequests, setMatchRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) return
    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchUserMatchRequests(user.user_id)
        setMatchRequests(data || [])
      } catch (error) {
        console.warn('[NotificationsPage] Failed to load match requests:', error)
        setMatchRequests([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authLoading, user])

  if (authLoading || loading) {
    return (
      <div className="dashboard-page">
        <Sidebar />
        <div className="dashboard-content">
          <div className="dashboard-card">Loading notifications...</div>
        </div>
      </div>
    )
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recently'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'withdrawn': 'Withdrawn',
      'expired': 'Expired'
    }
    return labels[status] || status
  }

  const getStatusClass = (status) => {
    const classes = {
      'pending': 'status-pending',
      'accepted': 'status-accepted',
      'rejected': 'status-rejected',
      'withdrawn': 'status-withdrawn',
      'expired': 'status-expired'
    }
    return classes[status] || ''
  }

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Notifications</h1>
            <p>Latest updates across your teams and requests.</p>
          </div>
          <div className="dashboard-actions">
            <button className="primary">Mark all read</button>
            <button className="ghost">Notification settings</button>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Match Requests</h2>
            <button>View history</button>
          </div>
          {matchRequests.length === 0 ? (
            <div className="empty-state">No match requests yet.</div>
          ) : (
            <ul className="dashboard-list">
              {matchRequests.map((request) => {
                const courseCode = `${request.subject || ''} ${request.number || ''}`.trim()
                const teamName = request.team_name || 'team'
                const postTitle = request.post_title || 'post'
                
                return (
                  <li key={request.request_id}>
                    <div>
                      <h3>
                        {request.status === 'pending' && `Request to ${courseCode}`}
                        {request.status === 'accepted' && `Match accepted: ${courseCode}`}
                        {request.status === 'rejected' && `Request declined: ${courseCode}`}
                        {request.status === 'withdrawn' && `Request withdrawn: ${courseCode}`}
                        {request.status === 'expired' && `Request expired: ${courseCode}`}
                        {!['pending', 'accepted', 'rejected', 'withdrawn', 'expired'].includes(request.status) && `Request: ${courseCode}`}
                      </h3>
                      <p>
                        {request.status === 'pending' && `Waiting for response from ${teamName}`}
                        {request.status === 'accepted' && `You've been accepted to ${teamName}`}
                        {request.status === 'rejected' && `Your request to ${teamName} was declined`}
                        {request.status === 'withdrawn' && `You withdrew your request to ${teamName}`}
                        {request.status === 'expired' && `Your request to ${teamName} has expired`}
                        {request.message && ` • ${request.message.substring(0, 100)}${request.message.length > 100 ? '...' : ''}`}
                      </p>
                      {request.course_title && <p className="text-muted">{request.course_title}</p>}
                    </div>
                    <div>
                      <span className={`dashboard-pill ${getStatusClass(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                      <span className="dashboard-pill time-pill">{formatTime(request.created_at)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
