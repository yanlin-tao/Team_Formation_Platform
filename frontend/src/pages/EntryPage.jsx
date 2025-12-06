import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiUserGroup, HiPlus } from 'react-icons/hi2'
import Sidebar from '../components/Sidebar'
import TermSelector from '../components/TermSelector'
import SearchBar from '../components/SearchBar'
import CourseTags from '../components/CourseTags'
import PostCard from '../components/PostCard'
import { fetchTerms, fetchPopularPosts, searchPosts, getStoredUser } from '../services/api'
import teamupLogo from '../assets/teamup-logo.png'
import './EntryPage.css'

function EntryPage() {
  const [posts, setPosts] = useState([])
  const [terms, setTerms] = useState([])
  const [selectedTermId, setSelectedTermId] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [termsLoading, setTermsLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  useEffect(() => {
    const initializeTerms = async () => {
      try {
        setTermsLoading(true)
        const data = await fetchTerms()
        console.log('[EntryPage] Fetched terms:', data) // Debug log
        if (data && data.length > 0) {
          setTerms(data)
          // 默认选择第一个学期（最新的）
          setSelectedTermId(data[0].term_id)
          console.log('[EntryPage] Selected term:', data[0].term_id) // Debug log
        } else {
          console.warn('[EntryPage] No terms found in response')
          setTerms([])
        }
      } catch (err) {
        console.error('[EntryPage] Error loading terms:', err)
        setTerms([])
      } finally {
        setTermsLoading(false)
      }
    }
    
    initializeTerms()
  }, [])

  useEffect(() => {
    // 只有在已选择学期且没有搜索时才加载popular posts
    if (selectedTermId !== null && !isSearchMode) {
  const loadPopularPosts = async () => {
    try {
      setLoading(true)
          const data = await fetchPopularPosts(selectedTermId)
      setPosts(data)
      setError(null)
    } catch (err) {
      setError('Failed to load popular posts. Please try again later.')
      console.error('Error loading posts:', err)
        } finally {
          setLoading(false)
        }
      }
      
      loadPopularPosts()
    }
  }, [selectedTermId, isSearchMode])

  const handleTermChange = (termId) => {
    setSelectedTermId(termId)
    // 如果切换学期，清除搜索并重新加载popular posts
    if (isSearchMode) {
      setSelectedCourse(null)
      setIsSearchMode(false)
    }
    // Popular posts will be reloaded by useEffect when isSearchMode changes
  }

  const handleCourseSearch = async (course) => {
    if (!course || !selectedTermId || !course.course_id) {
      // Clear search and reload popular posts
      setIsSearchMode(false)
      setSelectedCourse(null)
      if (selectedTermId) {
        // Reload popular posts
        try {
          setLoading(true)
          const data = await fetchPopularPosts(selectedTermId)
          setPosts(data)
          setError(null)
        } catch (err) {
          setError('Failed to load popular posts. Please try again later.')
          console.error('Error loading posts:', err)
        } finally {
          setLoading(false)
        }
      } else {
        setPosts([])
      }
      return
    }

    try {
      setLoading(true)
      setIsSearchMode(true)
      setSelectedCourse(course)
      setError(null)

      // Debug: Log search parameters
      console.log('[EntryPage] Searching posts with:', {
        termId: selectedTermId,
        courseId: course.course_id,
        course: course
      })

      // Search for posts by course_id
      const data = await searchPosts(selectedTermId, course.course_id)
      console.log('[EntryPage] Search results:', data)
      setPosts(data || [])
    } catch (err) {
      console.error('[EntryPage] Error searching posts:', err)
      console.error('[EntryPage] Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      })
      setError(`Failed to search posts: ${err.message || 'Please try again later.'}`)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handlePostClick = (postId) => {
    navigate(`/posts/${postId}`)
  }

  const handleCreatePost = () => {
    if (!storedUser) {
      navigate('/auth')
      return
    }
    navigate('/posts/create')
  }

  return (
    <div className="entry-page">
      <Sidebar />
      <div className="entry-content">
        <div className="entry-top-bar">
        <div className="entry-header">
            <h1 className="entry-title">
              <HiUserGroup className="title-icon" />
              TeamUp UIUC
            </h1>
          <p className="entry-subtitle">Find your perfect teammates for course projects</p>
          </div>
          <div className="entry-logo">
            <div className="logo-container">
              <img src={teamupLogo} alt="TeamUp UIUC Logo" className="logo-image" />
            </div>
          </div>
        </div>

        <div className="filters-container">
          <TermSelector
            terms={terms}
            selectedTermId={selectedTermId}
            onTermChange={handleTermChange}
            loading={termsLoading}
          />
          <SearchBar
            termId={selectedTermId}
            onSearch={handleCourseSearch}
            onCourseSelect={handleCourseSearch}
          />
        </div>

        <div className="course-tags-wrapper">
          <CourseTags
            termId={selectedTermId}
            onCourseSelect={handleCourseSearch}
          />
        </div>

        <div className="posts-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-accent">
                {isSearchMode && selectedCourse
                  ? `${selectedCourse.subject} ${selectedCourse.number} - ${selectedCourse.title}`
                  : 'Popular Posts'}
              </span>
            </h2>
            <button 
              className="section-badge create-post-btn"
              onClick={handleCreatePost}
              title="Create a new post"
            >
              <HiPlus className="create-post-icon" />
              Create Post
            </button>
          </div>
          
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            <div className="loading-message">Loading posts...</div>
            </div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className="empty-message">
              <HiUserGroup className="empty-icon" />
              <p>No posts available at the moment.</p>
            </div>
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

