import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { getUserTeams } from '../services/api'
import './DashboardPages.css'

function TeamsPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useRequireAuth()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) return
    const load = async () => {
      try {
        setLoading(true)
        const data = await getUserTeams(user.user_id)
        setTeams(data || [])
      } catch (error) {
        console.warn('[TeamsPage] Failed to load teams:', error)
        setTeams([])
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
          <div className="dashboard-card">Loading teams...</div>
        </div>
      </div>
    )
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

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
              {teams.map((team) => {
                const courseCode = `${team.subject || ''} ${team.number || ''}`.trim()
                const courseName = team.course_title || 'Course'
                const openSpots = Math.max(0, (team.target_size || 0) - (team.current_size || 0))
                
                return (
                  <li 
                    key={team.team_id}
                    onClick={() => navigate(`/teams/${team.team_id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                  <div>
                      <h3>{courseCode} • {team.team_name}</h3>
                      <p>{courseName}</p>
                      <p>
                        Status: {team.status || 'open'} • 
                        Size: {team.current_size || 0}/{team.target_size || 0} • 
                        Open spots: {openSpots} • 
                        Joined: {formatDate(team.joined_at)}
                      </p>
                  </div>
                    <span className="dashboard-pill">{team.role || 'member'}</span>
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

export default TeamsPage
