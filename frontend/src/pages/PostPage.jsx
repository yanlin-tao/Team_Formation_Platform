import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { fetchPostById, sendJoinRequest } from '../services/api'
import './PostPage.css'

function PostPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [sendingRequest, setSendingRequest] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  useEffect(() => {
    loadPost()
  }, [postId])

  const loadPost = async () => {
    try {
      setLoading(true)
      const data = await fetchPostById(postId)
      setPost(data)
      setError(null)
    } catch (err) {
      setError('Failed to load post. Please try again later.')
      console.error('Error loading post:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async (e) => {
    e.preventDefault()
    if (!requestMessage.trim()) {
      alert('Please enter a message')
      return
    }

    try {
      setSendingRequest(true)
      await sendJoinRequest(postId, requestMessage)
      setRequestSent(true)
      setRequestMessage('')
      alert('Join request sent successfully!')
    } catch (err) {
      alert('Failed to send request. Please try again.')
      console.error('Error sending request:', err)
    } finally {
      setSendingRequest(false)
    }
  }

  if (loading) {
    return (
      <div className="post-page">
        <Sidebar />
        <div className="post-content">
          <div className="post-content-wrapper">
            <div className="loading-message">Loading post...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="post-page">
        <Sidebar />
        <div className="post-content">
          <div className="post-content-wrapper">
            <div className="error-message">{error || 'Post not found'}</div>
            <button className="back-button" onClick={() => navigate('/')}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="post-page">
      <Sidebar />
      <div className="post-content">
        <div className="post-content-wrapper">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Home
          </button>

          <div className="post-detail">
          <div className="post-header">
            <h1 className="post-title">{post.title}</h1>
            <div className="post-meta">
              <span className="post-author">By {post.author_name || 'Unknown'}</span>
              <span className="post-date">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="post-info">
            <div className="info-item">
              <strong>Course:</strong> 
              {post.course_subject && post.course_number 
                ? `${post.course_subject} ${post.course_number}${post.course_title ? ` - ${post.course_title}` : ''}`
                : post.course_title || 'N/A'}
            </div>
            {post.section_code && (
              <div className="info-item">
                <strong>Section:</strong> {post.section_code}
              </div>
            )}
            {post.target_team_size && (
              <div className="info-item">
                <strong>Target Team Size:</strong> {post.target_team_size}
              </div>
            )}
          </div>

          <div className="post-body">
            <h3>Description</h3>
            <p className="post-content-text">{post.content}</p>
          </div>

          {post.skills && post.skills.length > 0 && (
            <div className="post-skills">
              <h3>Required Skills</h3>
              <div className="skills-list">
                {post.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="post-stats">
            <div className="stat-item">
              <strong>Views:</strong> {post.view_count || 0}
            </div>
            <div className="stat-item">
              <strong>Requests:</strong> {post.request_count || 0}
            </div>
          </div>

          {!requestSent ? (
            <div className="join-request-section">
              <h3>Send Join Request</h3>
              <form onSubmit={handleSendRequest}>
                <textarea
                  className="request-message-input"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Tell them why you'd like to join..."
                  rows="4"
                  required
                />
                <button
                  type="submit"
                  className="send-request-button"
                  disabled={sendingRequest}
                >
                  {sendingRequest ? 'Sending...' : 'Send Join Request'}
                </button>
              </form>
            </div>
          ) : (
            <div className="request-sent-message">
              ✓ Join request sent successfully!
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostPage

