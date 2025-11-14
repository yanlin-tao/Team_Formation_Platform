import React from 'react'
import { HiEye, HiEnvelope, HiAcademicCap, HiUser } from 'react-icons/hi2'
import './PostCard.css'

function PostCard({ post, onClick }) {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'status-open'
      case 'closed':
        return 'status-closed'
      case 'full':
        return 'status-full'
      default:
        return 'status-open'
    }
  }

  return (
    <div className="post-card" onClick={onClick}>
      <div className="post-card-header">
        <h3 className="post-card-title">{post.title}</h3>
        <span className={`post-card-status ${getStatusColor(post.status)}`}>
          {post.status || 'open'}
        </span>
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
          <HiAcademicCap className="info-icon" />
          <span><strong>Course:</strong> {post.course_title || 'N/A'}</span>
        </div>
        {post.section_code && (
          <div className="post-card-section">
            <strong>Section:</strong> {post.section_code}
          </div>
        )}
      </div>

      {post.skills && post.skills.length > 0 && (
        <div className="post-card-skills">
          {post.skills.slice(0, 3).map((skill, index) => (
            <span key={index} className="skill-badge">
              {skill}
            </span>
          ))}
          {post.skills.length > 3 && (
            <span className="skill-badge-more">+{post.skills.length - 3}</span>
          )}
        </div>
      )}

      <div className="post-card-footer">
        <div className="post-card-stats">
          <span className="stat-item">
            <HiEye className="stat-icon" />
            {post.view_count || 0}
          </span>
          <span className="stat-item">
            <HiEnvelope className="stat-icon" />
            {post.request_count || 0}
          </span>
        </div>
        <div className="post-card-author">
          <HiUser className="author-icon" />
          <span>{post.author_name || 'Unknown'}</span>
        </div>
      </div>
    </div>
  )
}

export default PostCard

