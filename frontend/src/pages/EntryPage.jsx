import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import SearchBar from '../components/SearchBar'
import PostCard from '../components/PostCard'
import { fetchPopularPosts } from '../services/api'
import './EntryPage.css'

function EntryPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadPopularPosts()
  }, [])

  const loadPopularPosts = async () => {
    try {
      setLoading(true)
      const data = await fetchPopularPosts()
      setPosts(data)
      setError(null)
    } catch (err) {
      setError('Failed to load popular posts. Please try again later.')
      console.error('Error loading posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePostClick = (postId) => {
    navigate(`/posts/${postId}`)
  }

  return (
    <div className="entry-page">
      <Sidebar />
      <div className="entry-content">
        <div className="entry-header">
          <h1 className="entry-title">TeamUp UIUC!</h1>
          <p className="entry-subtitle">Find your perfect teammates for course projects</p>
        </div>

        <SearchBar />

        <div className="popular-posts-section">
          <h2 className="section-title">Popular Posts</h2>
          
          {loading && (
            <div className="loading-message">Loading posts...</div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className="empty-message">No posts available at the moment.</div>
          )}

          {!loading && !error && posts.length > 0 && (
            <div className="posts-grid">
              {posts.map((post) => (
                <PostCard
                  key={post.post_id}
                  post={post}
                  onClick={() => handlePostClick(post.post_id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EntryPage

