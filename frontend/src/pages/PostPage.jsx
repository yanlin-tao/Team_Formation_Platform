import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import {
  fetchPostById,
  sendJoinRequest,
  fetchComments,
  createComment,
  getStoredUser,
} from '../services/api'
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

  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [commentError, setCommentError] = useState(null)
  const [postingComment, setPostingComment] = useState(false)
  const [sessionUser, setSessionUser] = useState(() => getStoredUser())

  useEffect(() => {
    const handleStorage = () => setSessionUser(getStoredUser())
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    loadPost()
    loadComments()
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

  const loadComments = async () => {
    try {
      setCommentsLoading(true)
      const data = await fetchComments(postId)
      setComments(data || [])
    } catch (err) {
      console.error('Error loading comments:', err)
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleSendRequest = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!requestMessage.trim()) {
      alert('Please enter a message')
      return
    }

    const activeUser = sessionUser || getStoredUser()
    if (!activeUser?.user_id) {
      alert('Please sign in to send a join request')
      navigate('/auth')
      return
    }

    // Check if user is the post author - don't allow sending request to own post
    if (post?.user_id === activeUser.user_id) {
      alert('You cannot send a join request to your own post')
      return
    }

    try {
      setSendingRequest(true)
      // Convert postId to number if it's a string
      const postIdNum = typeof postId === 'string' ? parseInt(postId, 10) : postId
      
      console.log('Sending join request:', { postId: postIdNum, userId: activeUser.user_id, message: requestMessage })
      
      await sendJoinRequest(postIdNum, requestMessage, activeUser.user_id)
      
      setRequestSent(true)
      setRequestMessage('')
      alert('Join request sent successfully!')
    } catch (err) {
      console.error('Error sending request:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to send request. Please try again.'
      alert(errorMsg)
      setSendingRequest(false)
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) {
      setCommentError('Please enter a comment before submitting.')
      return
    }

    const activeUser = sessionUser || getStoredUser()
    if (!activeUser?.user_id) {
      navigate('/auth')
      return
    }

    try {
      setPostingComment(true)
      setCommentError(null)
      await createComment(postId, {
        user_id: activeUser.user_id,
        content: newComment.trim(),
      })
      setNewComment('')
      await loadComments()
    } catch (err) {
      console.error('Error posting comment:', err)
      setCommentError('Failed to post comment. Please try again.')
    } finally {
      setPostingComment(false)
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

            {/* Only show join request section if user is logged in and not the post author */}
            {sessionUser && post?.user_id !== (sessionUser?.user_id || getStoredUser()?.user_id) && (
              !requestSent ? (
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
                      disabled={sendingRequest}
                    />
                    <button
                      type="submit"
                      className="send-request-button"
                      disabled={sendingRequest || !requestMessage.trim()}
                    >
                      {sendingRequest ? 'Sending...' : 'Send Join Request'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="request-sent-message">
                  ✓ Join request sent successfully!
                </div>
              )
            )}
            
            {/* Show message if user is not logged in */}
            {!sessionUser && (
              <div className="join-request-section">
                <h3>Send Join Request</h3>
                <p style={{ color: '#666', marginBottom: '10px' }}>
                  Please <button onClick={() => navigate('/auth')} style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#0066cc', 
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0
                  }}>sign in</button> to send a join request.
                </p>
              </div>
            )}
            
            {/* Show message if user is the post author */}
            {sessionUser && post?.user_id === (sessionUser?.user_id || getStoredUser()?.user_id) && (
              <div className="join-request-section">
                <h3>Join Requests</h3>
                <p style={{ color: '#666' }}>
                  You can view join requests for this post in your <button onClick={() => navigate('/notifications')} style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#0066cc', 
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0
                  }}>notifications</button> page.
                </p>
              </div>
            )}

            <section className="comments-section">
              <div className="comments-header">
                <h3>Comments ({comments.length})</h3>
              </div>

              {commentsLoading ? (
                <div className="comment-loading">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="empty-comment">No comments yet.</div>
              ) : (
                <ul className="comment-list">
                  {comments.map((comment) => (
                    <li key={comment.comment_id} className="comment-item">
                      <div className="comment-avatar">
                        {comment.author_name
                          ? comment.author_name
                              .split(' ')
                              .map((part) => part[0])
                              .join('')
                              .slice(0, 2)
                          : 'U'}
                      </div>
                      <div className="comment-body">
                        <div className="comment-meta">
                          <strong>{comment.author_name || 'Unknown'}</strong>
                          <span>{comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}</span>
                        </div>
                        <p>{comment.content}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <form className="comment-form" onSubmit={handleCommentSubmit}>
                <textarea
                  placeholder={sessionUser ? 'Share your thoughts...' : 'Sign in to leave a comment'}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows="3"
                  disabled={!sessionUser}
                />
                {commentError && <div className="comment-error">{commentError}</div>}
                <button type="submit" disabled={!sessionUser || postingComment}>
                  {postingComment ? 'Posting...' : 'Comment'}
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostPage
