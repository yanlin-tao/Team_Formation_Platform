import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { fetchProfile } from '../services/api'
import { fallbackProfile } from '../utils/profileTemplates'
import './DashboardPages.css'

function NotificationsPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const [profilePayload, setProfilePayload] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) return
    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchProfile(user.user_id)
        setProfilePayload(data || fallbackProfile)
      } catch (error) {
        console.warn('[NotificationsPage] fallback profile used', error)
        setProfilePayload(fallbackProfile)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authLoading, user])

  if (authLoading || loading || !profilePayload) {
    return (
      <div className="dashboard-page">
        <Sidebar />
        <div className="dashboard-content">
          <div className="dashboard-card">Loading notifications...</div>
        </div>
      </div>
    )
  }

  const updates = profilePayload.recentActivity || []

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
            <h2>Recent activity</h2>
            <button>View history</button>
          </div>
          {updates.length === 0 ? (
            <div className="empty-state">No new notifications.</div>
          ) : (
            <ul className="dashboard-list">
              {updates.map((item) => (
                <li key={`${item.title}-${item.time}`}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                  </div>
                  <span className="dashboard-pill">{item.time}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
