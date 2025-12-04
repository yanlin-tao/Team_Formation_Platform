import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { fetchProfile, getUserTeams, getUserCourses, searchCourses, fetchTerms } from '../services/api'
import TermSelector from '../components/TermSelector'
import './DashboardPages.css'

function CoursesPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const navigate = useNavigate()
  const [profilePayload, setProfilePayload] = useState(null)
  const [teams, setTeams] = useState([])
  const [courses, setCourses] = useState([])
  const [terms, setTerms] = useState([])
  const [selectedTermId, setSelectedTermId] = useState(null)
  const [courseSearchQuery, setCourseSearchQuery] = useState('')
  const [courseSearchResults, setCourseSearchResults] = useState([])
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTerms = async () => {
      try {
        const data = await fetchTerms()
        if (data && data.length > 0) {
          setTerms(data)
          setSelectedTermId(data[0].term_id)
        }
      } catch (err) {
        console.error('Error loading terms:', err)
      }
    }
    loadTerms()
  }, [])

  useEffect(() => {
    if (authLoading || !user) return
    const load = async () => {
      try {
        setLoading(true)
        const [profileData, teamsData, coursesData] = await Promise.all([
          fetchProfile(user.user_id),
          getUserTeams(user.user_id),
          getUserCourses(user.user_id)
        ])
        setProfilePayload(profileData || { stats: [] })
        setTeams(teamsData || [])
        setCourses(coursesData || [])
      } catch (error) {
        console.warn('[CoursesPage] Failed to load data:', error)
        setProfilePayload({ stats: [] })
        setTeams([])
        setCourses([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authLoading, user])

  const handleCourseSearch = async (query) => {
    if (!query || !query.trim() || !selectedTermId) {
      setCourseSearchResults([])
      return
    }
    try {
      const results = await searchCourses(selectedTermId, query)
      setCourseSearchResults(results || [])
    } catch (err) {
      console.error('Error searching courses:', err)
      setCourseSearchResults([])
    }
  }

  const stats = profilePayload?.stats || []

  if (authLoading || loading) {
    return (
      <div className="dashboard-page">
        <Sidebar />
        <div className="dashboard-content">
          <div className="dashboard-card">Loading course overview...</div>
        </div>
      </div>
    )
  }

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
            <button className="primary" onClick={() => setShowAddCourse(!showAddCourse)}>
              {showAddCourse ? 'Cancel' : 'Find Course Teams'}
            </button>
            <button className="ghost" onClick={() => navigate('/posts/create')}>
              Create Post
            </button>
          </div>
        </div>

        {showAddCourse && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Find Course Teams</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: 'var(--uiuc-gray)', margin: 0 }}>
                Search for a course to find available teams or create a new post to start your own team.
              </p>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Term
                </label>
                <TermSelector
                  terms={terms}
                  selectedTermId={selectedTermId}
                  onTermChange={setSelectedTermId}
                  loading={false}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Search Course
                </label>
                <input
                  type="text"
                  placeholder="Search for a course (e.g., CS 411)"
                  value={courseSearchQuery}
                  onChange={(e) => {
                    const query = e.target.value
                    setCourseSearchQuery(query)
                    handleCourseSearch(query)
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--uiuc-light-gray)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                {courseSearchResults.length > 0 && (
                  <div style={{
                    marginTop: '0.5rem',
                    border: '1px solid var(--uiuc-light-gray)',
                    borderRadius: '8px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {courseSearchResults.map((course) => (
                      <div
                        key={course.course_id}
                        style={{
                          padding: '1rem',
                          borderBottom: '1px solid var(--uiuc-light-gray)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        <div>
                          <strong>{course.subject} {course.number}</strong> - {course.title}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button
                            className="primary"
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.875rem',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              navigate(`/?search=${encodeURIComponent(course.subject + ' ' + course.number)}`)
                              setShowAddCourse(false)
                            }}
                          >
                            View Posts
                          </button>
                          <button
                            className="ghost"
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.875rem',
                              borderRadius: '6px',
                              border: '1px solid var(--uiuc-light-gray)',
                              cursor: 'pointer',
                              background: 'white'
                            }}
                            onClick={() => {
                              navigate('/posts/create')
                            }}
                          >
                            Create Post
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-grid">
          {stats.filter(stat => stat.label !== 'Active Courses').map((stat) => (
            <div key={stat.label} className="dashboard-card">
              <h2>{stat.label}</h2>
              <p className="stat-value">{stat.value}</p>
              <p className="stat-trend">{stat.trend}</p>
            </div>
          ))}
          <div className="dashboard-card">
            <h2>My Courses</h2>
            <p className="stat-value">{courses.length}</p>
            <p className="stat-trend">Courses you're engaged with</p>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>My Courses ({courses.length})</h2>
            <button>Manage enrollments</button>
          </div>
          {courses.length === 0 ? (
            <div className="empty-state">
              No courses yet. Join a team or create a post to start collaborating on a course.
              <br />
              <button 
                className="primary" 
                onClick={() => setShowAddCourse(true)}
                style={{ marginTop: '1rem', padding: '0.75rem 1.5rem' }}
              >
                Find Course Teams
              </button>
            </div>
          ) : (
            <ul className="dashboard-list">
              {courses.map((course) => {
                const courseCode = `${course.subject} ${course.number}`
                const teamsCount = course.teams?.length || 0
                const postsCount = course.posts?.length || 0
                const totalEngagements = teamsCount + postsCount

                return (
                  <li key={course.course_id}>
                    <div>
                      <h3>{courseCode} - {course.title}</h3>
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {teamsCount > 0 && (
                          <p>
                            <strong>Teams ({teamsCount}):</strong>{' '}
                            {course.teams.map((team, idx) => (
                              <span key={team.team_id}>
                                {team.team_name} ({team.role || 'member'})
                                {idx < course.teams.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </p>
                        )}
                        {postsCount > 0 && (
                          <p>
                            <strong>Posts ({postsCount}):</strong>{' '}
                            {course.posts.map((post, idx) => (
                              <span key={post.post_id}>
                                {post.post_title}
                                {idx < course.posts.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </p>
                        )}
                        {totalEngagements === 0 && (
                          <p style={{ color: 'var(--uiuc-gray)' }}>No active engagements</p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                      {teamsCount > 0 && (
                        <span className="dashboard-pill">{teamsCount} team{teamsCount !== 1 ? 's' : ''}</span>
                      )}
                      {postsCount > 0 && (
                        <span className="dashboard-pill">{postsCount} post{postsCount !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
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
              {teams.map((team) => {
                const courseCode = `${team.subject || ''} ${team.number || ''}`.trim()
                return (
                  <li key={team.team_id}>
                  <div>
                      <h3>{courseCode} • {team.team_name}</h3>
                      <p>{team.course_title || 'Course project'}</p>
                      <p>Size: {team.current_size || 0}/{team.target_size || 0} • Status: {team.status || 'open'}</p>
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

export default CoursesPage
