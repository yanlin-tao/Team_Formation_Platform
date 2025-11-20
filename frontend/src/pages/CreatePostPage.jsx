import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiXMark, HiCheckCircle } from 'react-icons/hi2'
import Sidebar from '../components/Sidebar'
import TermSelector from '../components/TermSelector'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { 
  fetchTerms, 
  searchCourses, 
  getSectionsByCourse, 
  createPost,
  getStoredUser 
} from '../services/api'
import './CreatePostPage.css'

function CreatePostPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [terms, setTerms] = useState([])
  const [selectedTermId, setSelectedTermId] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [sections, setSections] = useState([])
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [targetSize, setTargetSize] = useState(4)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [courseSearchQuery, setCourseSearchQuery] = useState('')
  const [courseSearchResults, setCourseSearchResults] = useState([])
  const [showCourseResults, setShowCourseResults] = useState(false)

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
    const loadSections = async () => {
      if (!selectedCourse?.course_id) {
        setSections([])
        setSelectedSectionId(null)
        return
      }
      try {
        const data = await getSectionsByCourse(selectedCourse.course_id)
        setSections(data || [])
        setSelectedSectionId(null)
      } catch (err) {
        console.error('Error loading sections:', err)
        setSections([])
      }
    }
    loadSections()
  }, [selectedCourse])

  const handleCourseSearch = async (query) => {
    if (!query || !query.trim()) {
      setCourseSearchResults([])
      setShowCourseResults(false)
      return
    }
    if (!selectedTermId) {
      setError('Please select a term first')
      return
    }
    try {
      const results = await searchCourses(selectedTermId, query)
      setCourseSearchResults(results || [])
      setShowCourseResults(true)
    } catch (err) {
      console.error('Error searching courses:', err)
      setError('Failed to search courses')
    }
  }

  const handleCourseSelect = (course) => {
    setSelectedCourse(course)
    setCourseSearchQuery(`${course.subject} ${course.number} - ${course.title}`)
    setCourseSearchResults([])
    setShowCourseResults(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!selectedTermId) {
      setError('Please select a term')
      return
    }
    if (!selectedCourse) {
      setError('Please select a course')
      return
    }
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }
    if (!content.trim()) {
      setError('Please enter post content')
      return
    }
    if (!teamName.trim()) {
      setError('Please enter a team name')
      return
    }
    if (teamName.trim().length > 128) {
      setError('Team name cannot exceed 128 characters')
      return
    }
    if (targetSize < 1 || targetSize > 10) {
      setError('Team size must be between 1 and 10')
      return
    }
    if (!storedUser?.user_id) {
      setError('User not authenticated')
      navigate('/auth')
      return
    }

    try {
      setSubmitting(true)
      const postData = {
        user_id: storedUser.user_id,
        term_id: selectedTermId,
        course_id: selectedCourse.course_id,
        section_id: selectedSectionId || null,
        team_name: teamName.trim(),
        target_size: targetSize,
        title: title.trim(),
        content: content.trim(),
      }

      const result = await createPost(postData)
      navigate(`/posts/${result.post_id}`)
    } catch (err) {
      console.error('Error creating post:', err)
      setError(err.message || 'Failed to create post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/')
  }

  if (authLoading) {
    return (
      <div className="create-post-page">
        <Sidebar />
        <div className="create-post-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-message">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="create-post-page">
      <Sidebar />
      <div className="create-post-content">
        <div className="create-post-header">
          <h1 className="create-post-title">Create New Post</h1>
          <button className="close-btn" onClick={handleCancel} title="Cancel">
            <HiXMark />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-post-form">
          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="form-section">
            <label className="form-label">
              Term <span className="required">*</span>
            </label>
            <TermSelector
              terms={terms}
              selectedTermId={selectedTermId}
              onTermChange={setSelectedTermId}
              loading={false}
            />
          </div>

          <div className="form-section">
            <label className="form-label">
              Course <span className="required">*</span>
            </label>
            <div className="course-search-wrapper">
              <input
                type="text"
                className="form-input"
                placeholder="Search for a course (e.g., CS 411)"
                value={courseSearchQuery}
                onChange={(e) => {
                  const query = e.target.value
                  setCourseSearchQuery(query)
                  handleCourseSearch(query)
                }}
                onFocus={() => {
                  if (courseSearchResults.length > 0) {
                    setShowCourseResults(true)
                  }
                }}
              />
              {showCourseResults && courseSearchResults.length > 0 && (
                <div className="course-results-dropdown">
                  {courseSearchResults.map((course) => (
                    <div
                      key={course.course_id}
                      className="course-result-item"
                      onClick={() => handleCourseSelect(course)}
                    >
                      <div className="course-result-code">
                        {course.subject} {course.number}
                      </div>
                      <div className="course-result-title">{course.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedCourse && (
              <div className="selected-course">
                <HiCheckCircle className="check-icon" />
                {selectedCourse.subject} {selectedCourse.number} - {selectedCourse.title}
              </div>
            )}
          </div>

          {selectedCourse && sections.length > 0 && (
            <div className="form-section">
              <label className="form-label">Section <span className="required">*</span></label>
              <select
                className="form-select"
                value={selectedSectionId || ''}
                onChange={(e) => setSelectedSectionId(e.target.value || null)}
                required
              >
                <option value="">Select a section</option>
                {sections.map((section) => (
                  <option key={section.crn} value={section.crn}>
                    {section.crn} {section.instructor ? `- ${section.instructor}` : ''}
                    {section.location ? ` (${section.location})` : ''}
                  </option>
                ))}
              </select>
              <small className="form-hint">Please select a section for your team</small>
            </div>
          )}

          {selectedCourse && (!sections || sections.length === 0) && (
            <div className="form-section">
              <div className="warning-message">
                No sections available for this course. You may proceed without a specific section.
              </div>
            </div>
          )}

          <div className="form-section">
            <label className="form-label">
              Team Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter a unique team name (e.g., CS411-Team-A)"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              maxLength={128}
              required
            />
            <small className="form-hint">{teamName.length}/128 characters</small>
          </div>

          <div className="form-section">
            <label className="form-label">
              Target Team Size <span className="required">*</span>
            </label>
            <input
              type="number"
              className="form-input"
              min="1"
              max="10"
              value={targetSize}
              onChange={(e) => setTargetSize(parseInt(e.target.value) || 1)}
              required
            />
            <small className="form-hint">Number of team members you're looking for (1-10)</small>
          </div>

          <div className="form-section">
            <label className="form-label">
              Post Title <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter a descriptive title for your post"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={128}
              required
            />
            <small className="form-hint">{title.length}/128 characters</small>
          </div>

          <div className="form-section">
            <label className="form-label">
              Post Content <span className="required">*</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="Describe what you're looking for in teammates, project details, meeting preferences, etc."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              maxLength={4000}
              required
            />
            <small className="form-hint">{content.length}/4000 characters</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePostPage

