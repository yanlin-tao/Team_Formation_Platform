import React from 'react'
import './PostCard.css'

function PostCard({ post, onClick }) {
  return (
    <div className="post-card" onClick={onClick}>
      <div className="post-card-header">
        <h3 className="post-card-title">{post.title}</h3>
        <span className="post-card-status">{post.status || 'open'}</span>
      </div>
      
      <div className="post-card-content">
        <p className="post-card-preview">
          {post.content && post.content.length > 150
            ? post.content.substring(0, 150) + '...'
            : post.content}
        </p>
      </div>

      <div className="post-card-info">
        <div className="post-card-course">
          <strong>Course:</strong> {post.course_title || 'N/A'}
        </div>
        {post.section_code && (
          <div className="post-card-section">
            <strong>Section:</strong> {post.section_code}
          </div>
        )}
      </div>

      <div className="post-card-footer">
        <div className="post-card-stats">
          <span className="stat-item">👁️ {post.view_count || 0}</span>
          <span className="stat-item">📨 {post.request_count || 0}</span>
        </div>
        <div className="post-card-author">
          By {post.author_name || 'Unknown'}
        </div>
      </div>
    </div>
  )
}

export default PostCard

