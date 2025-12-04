import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import {
  fetchPostById,
  updatePost,
  deletePost,
  sendJoinRequest,
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
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
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [updatingComment, setUpdatingComment] = useState(false)
  const [editingPost, setEditingPost] = useState(false)
  const [editPostTitle, setEditPostTitle] = useState('')
  const [editPostContent, setEditPostContent] = useState('')
  const [updatingPost, setUpdatingPost] = useState(false)
  const [deletingPost, setDeletingPost] = useState(false)

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
    if (post?.author_id === activeUser.user_id) {
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

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.comment_id)
    setEditingCommentContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingCommentContent('')
  }

  const handleSaveEdit = async (commentId) => {
    const activeUser = sessionUser || getStoredUser()
    if (!activeUser?.user_id) {
      alert('Please sign in to edit comments')
      return
    }

    if (!editingCommentContent.trim()) {
      alert('Comment cannot be empty')
      return
    }

    try {
      setUpdatingComment(true)
      await updateComment(postId, commentId, editingCommentContent, activeUser.user_id)
      setEditingCommentId(null)
      setEditingCommentContent('')
      await loadComments()
    } catch (err) {
      console.error('Error updating comment:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update comment. Please try again.'
      alert(errorMsg)
    } finally {
      setUpdatingComment(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    const activeUser = sessionUser || getStoredUser()
    if (!activeUser?.user_id) {
      alert('Please sign in to delete comments')
      return
    }

    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      await deleteComment(postId, commentId, activeUser.user_id)
      await loadComments()
    } catch (err) {
      console.error('Error deleting comment:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to delete comment. Please try again.'
      alert(errorMsg)
    }
  }

  const handleEditPost = () => {
    setEditPostTitle(post.title)
    setEditPostContent(post.content)
    setEditingPost(true)
  }

  const handleCancelEditPost = () => {
    setEditingPost(false)
    setEditPostTitle('')
    setEditPostContent('')
  }

  const handleSaveEditPost = async () => {
    const activeUser = sessionUser || getStoredUser()
    if (!activeUser?.user_id) {
      alert('Please sign in to edit posts')
      return
    }

    if (!editPostTitle.trim()) {
      alert('Title cannot be empty')
      return
    }

    if (!editPostContent.trim()) {
      alert('Content cannot be empty')
      return
    }

    try {
      setUpdatingPost(true)
      await updatePost(
        postId,
        {
          title: editPostTitle.trim(),
          content: editPostContent.trim(),
        },
        activeUser.user_id
      )
      setEditingPost(false)
      await loadPost()
    } catch (err) {
      console.error('Error updating post:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update post. Please try again.'
      alert(errorMsg)
    } finally {
      setUpdatingPost(false)
    }
  }

  const handleDeletePost = async () => {
    const activeUser = sessionUser || getStoredUser()
    if (!activeUser?.user_id) {
      alert('Please sign in to delete posts')
      return
    }

    const confirmMessage = 'Are you sure you want to delete this post? This action cannot be undone.'
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setDeletingPost(true)
      await deletePost(postId, activeUser.user_id)
      alert('Post deleted successfully')
      navigate('/')
    } catch (err) {
      console.error('Error deleting post:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to delete post. Please try again.'
      alert(errorMsg)
      setDeletingPost(false)
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
              <div className="post-header-top">
                {editingPost ? (
                  <input
                    type="text"
                    value={editPostTitle}
                    onChange={(e) => setEditPostTitle(e.target.value)}
                    className="post-edit-title-input"
                    disabled={updatingPost}
                  />
                ) : (
                  <h1 className="post-title">{post.title}</h1>
                )}
                {sessionUser && post?.author_id === (sessionUser?.user_id || getStoredUser()?.user_id) && !editingPost && (
                  <div className="post-actions">
                    <button
                      className="edit-post-btn"
                      onClick={handleEditPost}
                      title="Edit post"
                    >
                      Edit
                    </button>
                    <button
                      className="delete-post-btn"
                      onClick={handleDeletePost}
                      disabled={deletingPost}
                      title="Delete post"
                    >
                      {deletingPost ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
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
              {editingPost ? (
                <div className="post-edit-form">
                  <textarea
                    value={editPostContent}
                    onChange={(e) => setEditPostContent(e.target.value)}
                    className="post-edit-content-textarea"
                    rows="8"
                    disabled={updatingPost}
                  />
                  <div className="post-edit-actions">
                    <button
                      className="save-post-btn"
                      onClick={handleSaveEditPost}
                      disabled={updatingPost || !editPostTitle.trim() || !editPostContent.trim()}
                    >
                      {updatingPost ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="cancel-post-btn"
                      onClick={handleCancelEditPost}
                      disabled={updatingPost}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="post-content-text">{post.content}</p>
              )}
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
            {sessionUser && post?.author_id !== (sessionUser?.user_id || getStoredUser()?.user_id) && (
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
            {sessionUser && post?.author_id === (sessionUser?.user_id || getStoredUser()?.user_id) && (
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
                  {comments.map((comment) => {
                    const activeUser = sessionUser || getStoredUser()
                    const isOwnComment = activeUser && comment.user_id === activeUser.user_id
                    
                    return (
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
                            {isOwnComment && editingCommentId !== comment.comment_id && (
                              <div className="comment-actions">
                                <button
                                  className="edit-comment-btn"
                                  onClick={() => handleEditComment(comment)}
                                  title="Edit your comment"
                                >
                                  Edit
                                </button>
                                <button
                                  className="delete-comment-btn"
                                  onClick={() => handleDeleteComment(comment.comment_id)}
                                  title="Delete your comment"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          {editingCommentId === comment.comment_id ? (
                            <div className="comment-edit-form">
                              <textarea
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                rows="3"
                                disabled={updatingComment}
                                className="comment-edit-textarea"
                              />
                              <div className="comment-edit-actions">
                                <button
                                  className="save-comment-btn"
                                  onClick={() => handleSaveEdit(comment.comment_id)}
                                  disabled={updatingComment || !editingCommentContent.trim()}
                                >
                                  {updatingComment ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  className="cancel-comment-btn"
                                  onClick={handleCancelEdit}
                                  disabled={updatingComment}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p>{comment.content}</p>
                          )}
                        </div>
                      </li>
                    )
                  })}
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
