import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { fetchProfile, logoutUser } from '../services/api'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { fallbackProfile } from '../utils/profileTemplates'
import './ProfilePage.css'

function ProfilePage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useRequireAuth()
  const [profilePayload, setProfilePayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) return

    const loadProfile = async () => {
      try {
        setLoading(true)
        const data = await fetchProfile(user.user_id)
        setProfilePayload(data || fallbackProfile)
      } catch (err) {
        console.error('[ProfilePage] Failed to load profile:', err)
        setError('Unable to load your profile right now. Showing sample data instead.')
        setProfilePayload(fallbackProfile)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [authLoading, user])

  const handleLogout = async () => {
    try {
      setSigningOut(true)
      await logoutUser()
    } finally {
      setSigningOut(false)
      navigate('/auth', { replace: true })
    }
  }

  if (authLoading || (loading && !profilePayload)) {
    return (
      <div className="profile-page">
        <Sidebar />
        <div className="profile-content">
          <div className="profile-card loading-card">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const data = profilePayload || fallbackProfile
  const { profile, stats, activeTeams, spotlightProjects, skills, recentActivity, learningTargets } = data
  const displayName = profile?.name || user.display_name || 'TeamUp Member'

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="profile-content">
        {error && <div className="profile-error">{error}</div>}
        <section className="profile-hero">
          <div className="profile-bio">
            <div className="profile-avatar">
              {displayName
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2) || 'TU'}
            </div>
            <div className="profile-meta">
              <h1>{displayName}</h1>
              <p className="profile-title">{profile?.title}</p>
              <div className="profile-tags">
                {profile?.major && <span>{profile.major}</span>}
                {profile?.graduation && <span>{profile.graduation}</span>}
                {profile?.location && <span>{profile.location}</span>}
              </div>
              {profile?.bio && <p className="profile-description">{profile.bio}</p>}
              {profile?.availability && (
                <div className="profile-availability">
                  <strong>Availability:</strong> {profile.availability}
                </div>
              )}
            </div>
          </div>
          <div className="profile-actions">
            <button className="primary">Share Availability</button>
            <button className="ghost">Edit Profile</button>
            <button className="ghost danger" onClick={handleLogout} disabled={signingOut}>
              {signingOut ? 'Signing out...' : 'Log out'}
            </button>
          </div>
        </section>

        <section className="profile-stats-grid">
          {stats?.map((stat) => (
            <div key={stat.label} className="profile-stat-card">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-trend">{stat.trend}</div>
            </div>
          ))}
        </section>

        <div className="profile-main-grid">
          <div className="profile-left-column">
            <section className="profile-section">
              <div className="section-header">
                <h2>Active Teams</h2>
                <button className="text-button">Manage Requests</button>
              </div>
              <div className="profile-card-stack">
                {activeTeams?.map((team) => (
                  <div key={team.name} className="profile-card">
                    <div className="card-title">{team.name}</div>
                    <div className="card-role">{team.role}</div>
                    <p className="card-focus">{team.focus}</p>
                    <div className="card-progress">
                      <div className="progress-label">
                        Progress
                        <span>{team.progress}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-value" style={{ width: `${team.progress}%` }} />
                      </div>
                    </div>
                    <div className="card-meta">
                      <span>Open spots: {team.spots}</span>
                      <button className="ghost small">View Sprint</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-section">
              <div className="section-header">
                <h2>Skills & Tools</h2>
                <button className="text-button">Update</button>
              </div>
              <div className="skills-grid">
                <div>
                  <h3>Core Strengths</h3>
                  <div className="skill-chips">
                    {skills?.core?.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>Tools & Stacks</h3>
                  <div className="skill-chips alt">
                    {skills?.tools?.map((tool) => (
                      <span key={tool}>{tool}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="profile-section">
              <div className="section-header">
                <h2>Learning Targets</h2>
                <button className="text-button">Share Plan</button>
              </div>
              <ul className="learning-list">
                {learningTargets?.map((item) => (
                  <li key={item.topic}>
                    <strong>{item.topic}</strong>
                    <p>{item.detail}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="profile-right-column">
            <section className="profile-section">
              <div className="section-header">
                <h2>Spotlight</h2>
                <button className="text-button">View Archive</button>
              </div>
              <div className="spotlight-list">
                {spotlightProjects?.map((project) => (
                  <article key={project.title}>
                    <span className="spotlight-course">{project.course}</span>
                    <h3>{project.title}</h3>
                    <p>{project.summary}</p>
                    <button className="ghost small">Open Case Study</button>
                  </article>
                ))}
              </div>
            </section>

            <section className="profile-section">
              <div className="section-header">
                <h2>Recent Activity</h2>
                <button className="text-button">See All</button>
              </div>
              <ul className="activity-list">
                {recentActivity?.map((activity) => (
                  <li key={activity.title}>
                    <div>
                      <h3>{activity.title}</h3>
                      <p>{activity.detail}</p>
                    </div>
                    <span>{activity.time}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
