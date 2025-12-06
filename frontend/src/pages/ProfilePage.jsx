import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { fetchProfile, logoutUser, updateProfile, getStoredUser } from '../services/api'
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
  const [isEditing, setIsEditing] = useState(false)
  const [editingProfile, setEditingProfile] = useState({
    display_name: '',
    phone_number: '',
    avatar_url: '',
    bio: '',
    major: '',
    grade: '',
    score: '',
  })
  const [saving, setSaving] = useState(false)

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

  const handleEditClick = () => {
    if (profilePayload?.profile) {
      const profile = profilePayload.profile
      const profileUser = profilePayload.user || user
      setEditingProfile({
        display_name: profile.name || profileUser?.display_name || '',
        phone_number: profileUser?.phone_number || '',
        avatar_url: profileUser?.avatar_url || '',
        bio: profile.bio || '',
        major: profile.major || '',
        grade: profile.graduation || '',
        score: profileUser?.score !== null && profileUser?.score !== undefined ? String(profileUser.score) : '',
      })
      setIsEditing(true)
      setError(null)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setError(null)
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    try {
      setSaving(true)
      setError(null)
      
      const profileUser = profilePayload?.user || user
      const updateData = {}
      if (editingProfile.display_name !== (profilePayload?.profile?.name || profileUser?.display_name || '')) {
        updateData.display_name = editingProfile.display_name
      }
      if (editingProfile.phone_number !== (profileUser?.phone_number || '')) {
        updateData.phone_number = editingProfile.phone_number
      }
      if (editingProfile.avatar_url !== (profileUser?.avatar_url || '')) {
        updateData.avatar_url = editingProfile.avatar_url
      }
      if (editingProfile.bio !== (profilePayload?.profile?.bio || '')) {
        updateData.bio = editingProfile.bio
      }
      if (editingProfile.major !== (profilePayload?.profile?.major || '')) {
        updateData.major = editingProfile.major
      }
      if (editingProfile.grade !== (profilePayload?.profile?.graduation || '')) {
        updateData.grade = editingProfile.grade
      }
      const currentScore = profileUser?.score !== null && profileUser?.score !== undefined ? String(profileUser.score) : ''
      if (editingProfile.score !== currentScore) {
        if (editingProfile.score.trim() === '') {
          updateData.score = null
        } else {
          const scoreValue = parseFloat(editingProfile.score)
          if (!isNaN(scoreValue)) {
            updateData.score = scoreValue
          }
        }
      }

      if (Object.keys(updateData).length === 0) {
        setIsEditing(false)
        return
      }

      await updateProfile(user.user_id, updateData)
      
      // Reload profile to get updated data
      const updatedData = await fetchProfile(user.user_id)
      setProfilePayload(updatedData || fallbackProfile)
      
      // Update stored user if display_name, avatar_url, phone_number, or score changed
      const storedUser = getStoredUser()
      if (storedUser) {
        if (updateData.display_name) storedUser.display_name = updateData.display_name
        if (updateData.avatar_url !== undefined) storedUser.avatar_url = updateData.avatar_url
        if (updateData.phone_number !== undefined) storedUser.phone_number = updateData.phone_number
        if (updateData.score !== undefined) storedUser.score = updateData.score
        localStorage.setItem('teamup_user', JSON.stringify(storedUser))
      }
      
      setIsEditing(false)
    } catch (err) {
      console.error('[ProfilePage] Failed to update profile:', err)
      setError(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleProfileChange = (field, value) => {
    setEditingProfile(prev => ({ ...prev, [field]: value }))
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
  const { profile, stats, activeTeams, spotlightProjects, skills, recentActivity, learningTargets, user: profileUser } = data
  // Use user from profile payload if available, otherwise fall back to auth user
  const displayUser = profileUser || user
  const displayName = profile?.name || displayUser?.display_name || 'TeamUp Member'

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="profile-content">
        {error && <div className="profile-error">{error}</div>}
        <section className="profile-hero">
          {!isEditing ? (
            <>
          <div className="profile-bio">
            <div className="profile-avatar">
                  {displayUser?.avatar_url ? (
                    <img src={displayUser.avatar_url} alt={displayName} />
                  ) : (
                    displayName
                .split(' ')
                .map((part) => part[0])
                .join('')
                      .slice(0, 2) || 'TU'
                  )}
            </div>
            <div className="profile-meta">
              <h1>{displayName}</h1>
              <div className="profile-tags">
                {profile?.major && <span>{profile.major}</span>}
                {profile?.graduation && <span>{profile.graduation}</span>}
                    {displayUser?.score !== null && displayUser?.score !== undefined && (
                      <span>GPA: {displayUser.score}</span>
                    )}
                    {displayUser?.phone_number && (
                      <span>TEL: {displayUser.phone_number}</span>
                    )}
              </div>
              {profile?.bio && <p className="profile-description">{profile.bio}</p>}
                  {displayUser?.avatar_url && (
                    <div className="profile-contact-info">
                      <div className="contact-item">
                        <strong>Avatar URL:</strong>{' '}
                        <a href={displayUser.avatar_url} target="_blank" rel="noopener noreferrer" className="avatar-link">
                          {displayUser.avatar_url}
                        </a>
                      </div>
                </div>
              )}
            </div>
          </div>
          <div className="profile-actions">
                <button className="primary" onClick={handleEditClick}>Edit Profile</button>
            <button className="ghost danger" onClick={handleLogout} disabled={signingOut}>
              {signingOut ? 'Signing out...' : 'Log out'}
            </button>
          </div>
            </>
          ) : (
            <div className="profile-edit-form">
              <h2>Edit Profile</h2>
              <div className="edit-form-grid">
                <div className="form-group">
                  <label htmlFor="display_name">Display Name</label>
                  <input
                    id="display_name"
                    type="text"
                    value={editingProfile.display_name}
                    onChange={(e) => handleProfileChange('display_name', e.target.value)}
                    placeholder="Your display name"
                    maxLength={128}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone_number">Phone Number</label>
                  <input
                    id="phone_number"
                    type="tel"
                    value={editingProfile.phone_number}
                    onChange={(e) => handleProfileChange('phone_number', e.target.value)}
                    placeholder="(123) 456-7890"
                    maxLength={32}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="avatar_url">Avatar URL</label>
                  <input
                    id="avatar_url"
                    type="url"
                    value={editingProfile.avatar_url}
                    onChange={(e) => handleProfileChange('avatar_url', e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    maxLength={256}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    value={editingProfile.bio}
                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    maxLength={1024}
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="major">Major</label>
                  <input
                    id="major"
                    type="text"
                    value={editingProfile.major}
                    onChange={(e) => handleProfileChange('major', e.target.value)}
                    placeholder="e.g., Computer Science"
                    maxLength={64}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="grade">Grade / Year</label>
                  <input
                    id="grade"
                    type="text"
                    value={editingProfile.grade}
                    onChange={(e) => handleProfileChange('grade', e.target.value)}
                    placeholder="e.g., Junior, Senior, Graduate"
                    maxLength={16}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="score">GPA / Score</label>
                  <input
                    id="score"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingProfile.score}
                    onChange={(e) => handleProfileChange('score', e.target.value)}
                    placeholder="e.g., 3.5"
                  />
                </div>
              </div>
              {error && <div className="profile-error">{error}</div>}
              <div className="edit-form-actions">
                <button className="primary" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="ghost" onClick={handleCancelEdit} disabled={saving}>
                  Cancel
                </button>
              </div>
            </div>
          )}
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
