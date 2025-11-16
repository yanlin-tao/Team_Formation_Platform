import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { fetchProfile } from '../services/api'
import { fallbackProfile } from '../utils/profileTemplates'
import './DashboardPages.css'

function TeamsPage() {
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
        console.warn('[TeamsPage] fallback profile used', error)
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
          <div className="dashboard-card">Loading teams...</div>
        </div>
      </div>
    )
  }

  const teams = profilePayload.activeTeams || []
  const targets = profilePayload.learningTargets || []

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>My Teams</h1>
            <p>Track progress and manage recruiting slots for each team.</p>
          </div>
          <div className="dashboard-actions">
            <button className="primary">Create team</button>
            <button className="ghost">Team settings</button>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Active collaborations</h2>
            <button>Open board</button>
          </div>
          {teams.length === 0 ? (
            <div className="empty-state">No teams yet. Start one to find teammates.</div>
          ) : (
            <ul className="dashboard-list">
              {teams.map((team) => (
                <li key={team.name}>
                  <div>
                    <h3>{team.name}</h3>
                    <p>{team.focus}</p>
                    <p>Progress: {team.progress}% • Open spots: {team.spots}</p>
                  </div>
                  <span className="dashboard-pill">{team.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Upcoming goals</h2>
            <button>Share update</button>
          </div>
          {targets.length === 0 ? (
            <div className="empty-state">No goals yet. Capture your next milestones.</div>
          ) : (
            <ul className="dashboard-list">
              {targets.map((item) => (
                <li key={item.topic}>
                  <div>
                    <h3>{item.topic}</h3>
                    <p>{item.detail}</p>
                  </div>
                  <span className="dashboard-pill">Focus</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamsPage
