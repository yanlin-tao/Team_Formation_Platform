import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { fetchProfile } from '../services/api'
import { fallbackProfile } from '../utils/profileTemplates'
import './DashboardPages.css'

function CoursesPage() {
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
        console.warn('[CoursesPage] fallback profile used', error)
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
          <div className="dashboard-card">Loading course overview...</div>
        </div>
      </div>
    )
  }

  const teams = profilePayload.activeTeams || []
  const stats = profilePayload.stats || []

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>My Courses</h1>
            <p>Snapshot of the classes where you currently collaborate.</p>
          </div>
          <div className="dashboard-actions">
            <button className="primary">Sync syllabus</button>
            <button className="ghost">Course settings</button>
          </div>
        </div>

        <div className="dashboard-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="dashboard-card">
              <h2>{stat.label}</h2>
              <p className="stat-value">{stat.value}</p>
              <p className="stat-trend">{stat.trend}</p>
            </div>
          ))}
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Active course teams</h2>
            <button>Manage enrollments</button>
          </div>
          {teams.length === 0 ? (
            <div className="empty-state">No active course teams yet.</div>
          ) : (
            <ul className="dashboard-list">
              {teams.map((team) => (
                <li key={team.name}>
                  <div>
                    <h3>{team.name}</h3>
                    <p>{team.focus}</p>
                  </div>
                  <span className="dashboard-pill">{team.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default CoursesPage
