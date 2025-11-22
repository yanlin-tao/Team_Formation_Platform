import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { fetchUserReceivedRequests, acceptJoinRequest, rejectJoinRequest } from '../services/api'
import './DashboardPages.css'

function NotificationsPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const [matchRequests, setMatchRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const loadRequests = async () => {
    if (!user) return
    try {
      setLoading(true)
      // Only fetch pending requests to show in notifications
      const data = await fetchUserReceivedRequests(user.user_id, 'pending')
      setMatchRequests(data || [])
    } catch (error) {
      console.warn('[NotificationsPage] Failed to load received requests:', error)
      setMatchRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading || !user) return
    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user])

  const handleAccept = async (requestId) => {
    if (!user || processing) return
    
    try {
      setProcessing(true)
      await acceptJoinRequest(user.user_id, requestId)
      // Reload requests (will only show pending ones)
      await loadRequests()
    } catch (error) {
      console.error('[NotificationsPage] Failed to accept request:', error)
      alert(`Failed to accept request: ${error.message || 'Unknown error'}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectClick = (request) => {
    setSelectedRequest(request)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleRejectConfirm = async () => {
    if (!user || !selectedRequest || processing) return
    
    try {
      setProcessing(true)
      await rejectJoinRequest(
        user.user_id, 
        selectedRequest.request_id, 
        rejectionReason.trim() || null
      )
      setShowRejectModal(false)
      setSelectedRequest(null)
      setRejectionReason('')
      // Reload requests (will only show pending ones)
      await loadRequests()
    } catch (error) {
      console.error('[NotificationsPage] Failed to reject request:', error)
      alert(`Failed to reject request: ${error.message || 'Unknown error'}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectCancel = () => {
    setShowRejectModal(false)
    setSelectedRequest(null)
    setRejectionReason('')
  }

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
                const senderName = request.sender_name || request.sender_netid || 'Someone'
                
                return (
                  <li key={request.request_id}>
                    <div>
                      <h3>
                        {senderName} wants to join your post
                      </h3>
                      <p>
                        {senderName} sent a join request for your post: <strong>{postTitle}</strong>
                        {courseCode && ` (${courseCode})`}
                        {request.message && ` • ${request.message.substring(0, 100)}${request.message.length > 100 ? '...' : ''}`}
                      </p>
                      {request.course_title && <p className="text-muted">{request.course_title}</p>}
                      {postTitle && (
                        <p className="text-muted">Post: {postTitle}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
                      <div className="request-actions">
                        <button
                          className="request-action-button accept"
                          onClick={() => handleAccept(request.request_id)}
                          disabled={processing}
                        >
                          {processing ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          className="request-action-button reject"
                          onClick={() => handleRejectClick(request)}
                          disabled={processing}
                        >
                          Reject
                        </button>
                      </div>
                      <span className="dashboard-pill time-pill">{formatTime(request.created_at)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="modal-overlay" onClick={handleRejectCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reject Join Request</h2>
            <p>
              Are you sure you want to reject <strong>{selectedRequest.sender_name || selectedRequest.sender_netid || 'this user'}</strong>'s join request?
            </p>
            <div style={{ marginTop: '1rem' }}>
              <label htmlFor="rejection-reason" className="modal-label">
                Rejection Reason (Optional):
              </label>
              <textarea
                id="rejection-reason"
                className="modal-textarea"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter a reason for rejection (optional)..."
              />
            </div>
            <div className="modal-actions">
              <button
                className="modal-button ghost"
                onClick={handleRejectCancel}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className="modal-button reject"
                onClick={handleRejectConfirm}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
