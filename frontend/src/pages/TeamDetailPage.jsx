import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { getTeamDetails } from '../services/api'
import { HiArrowLeft, HiUser, HiCalendar, HiAcademicCap } from 'react-icons/hi2'
import './DashboardPages.css'

function TeamDetailPage() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useRequireAuth()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user || !teamId) return
    const load = async () => {
      try {
        setLoading(true)
        const data = await getTeamDetails(parseInt(teamId))
        setTeam(data)
      } catch (error) {
        console.error('[TeamDetailPage] Failed to load team:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authLoading, user, teamId])

  if (authLoading || loading) {
    return (
      <div className="dashboard-page">
        <Sidebar />
        <div className="dashboard-content">
          <div className="dashboard-card">Loading team details...</div>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="dashboard-page">
        <Sidebar />
        <div className="dashboard-content">
          <div className="dashboard-card">
            <p>Team not found</p>
            <button onClick={() => navigate('/teams')}>Back to Teams</button>
          </div>
        </div>
      </div>
    )
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const courseCode = `${team.subject || ''} ${team.number || ''}`.trim()
  const openSpots = Math.max(0, (team.target_size || 0) - (team.current_size || 0))

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <button 
              onClick={() => navigate('/teams')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '16px',
                background: 'none',
                border: 'none',
                color: '#6366f1',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <HiArrowLeft /> Back to Teams
            </button>
            <h1>{team.team_name}</h1>
            <p>{courseCode} • {team.course_title || 'Course'}</p>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Team Information</h2>
          </div>
          <div className="dashboard-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Status</p>
                <p style={{ fontSize: '16px', fontWeight: '500' }}>{team.status || 'open'}</p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Team Size</p>
                <p style={{ fontSize: '16px', fontWeight: '500' }}>
                  {team.current_size || 0} / {team.target_size || 0}
                </p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Open Spots</p>
                <p style={{ fontSize: '16px', fontWeight: '500' }}>{openSpots}</p>
              </div>
              {team.section_code && (
                <div>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Section</p>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>{team.section_code}</p>
                </div>
              )}
            </div>
            {team.instructor && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Instructor</p>
                <p style={{ fontSize: '16px' }}>{team.instructor}</p>
              </div>
            )}
            {team.meeting_time && (
              <div style={{ marginTop: '8px' }}>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Meeting Time</p>
                <p style={{ fontSize: '16px' }}>{team.meeting_time}</p>
              </div>
            )}
            {team.location && (
              <div style={{ marginTop: '8px' }}>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Location</p>
                <p style={{ fontSize: '16px' }}>{team.location}</p>
              </div>
            )}
            {team.delivery_mode && (
              <div style={{ marginTop: '8px' }}>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Delivery Mode</p>
                <p style={{ fontSize: '16px' }}>{team.delivery_mode}</p>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Team Members ({team.members?.length || 0})</h2>
          </div>
          {!team.members || team.members.length === 0 ? (
            <div className="empty-state">No members yet</div>
          ) : (
            <ul className="dashboard-list">
              {team.members.map((member) => (
                <li key={member.user_id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    {member.avatar_url ? (
                      <img 
                        src={member.avatar_url} 
                        alt={member.display_name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                      />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <HiUser size={20} color="#6b7280" />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h3>{member.display_name || member.netid}</h3>
                      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                        {member.netid}
                        {member.major && ` • ${member.major}`}
                        {member.grade && ` • ${member.grade}`}
                      </p>
                      {member.email && (
                        <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '2px' }}>
                          {member.email}
                        </p>
                      )}
                      <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HiCalendar size={12} />
                        Joined: {formatDate(member.joined_at)}
                      </p>
                    </div>
                  </div>
                  <span className="dashboard-pill">{member.role || 'member'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamDetailPage

