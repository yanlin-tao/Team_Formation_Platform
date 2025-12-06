import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { fetchProfile } from '../services/api'
import { fallbackProfile } from '../utils/profileTemplates'
import './DashboardPages.css'

function MessagesPage() {
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
        console.warn('[MessagesPage] fallback profile used', error)
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
          <div className="dashboard-card">Loading conversations...</div>
        </div>
      </div>
    )
  }

  const conversations = (profilePayload.activeTeams || []).map((team) => ({
    title: team.name,
    snippet: `Latest update from ${team.role}`,
  }))

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Messages</h1>
            <p>Coordinate with teammates and respond to join requests.</p>
          </div>
          <div className="dashboard-actions">
            <button className="primary">Compose</button>
            <button className="ghost">Filters</button>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Team threads</h2>
            <button>Open inbox</button>
          </div>
          {conversations.length === 0 ? (
            <div className="empty-state">No conversations yet.</div>
          ) : (
            <ul className="dashboard-list">
              {conversations.map((conv) => (
                <li key={conv.title}>
                  <div>
                    <h3>{conv.title}</h3>
                    <p>{conv.snippet}</p>
                  </div>
                  <span className="dashboard-pill">Team chat</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessagesPage
