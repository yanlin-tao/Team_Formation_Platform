import React, { useState, useEffect } from 'react'
import './CourseTags.css'

function CourseTags({ termId, onCourseSelect }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadCourses = async () => {
      if (!termId) {
        setCourses([])
        return
      }

      try {
        setLoading(true)
        setError(null)
        const { getPopularCourses } = await import('../services/api')
        const data = await getPopularCourses(termId)
        setCourses(data || [])
      } catch (err) {
        console.error('Error loading popular courses:', err)
        setError(err)
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [termId])

  const handleCourseClick = (course) => {
    if (onCourseSelect && course) {
      onCourseSelect(course)
    }
  }

  if (!termId) {
    return null
  }

  if (loading) {
    return (
      <div className="course-tags-container">
        <span className="tag-label">Popular Courses:</span>
        <span className="tag-loading">Loading...</span>
      </div>
    )
  }

  if (error || courses.length === 0) {
    return null
  }

  return (
    <div className="course-tags-container">
      <span className="tag-label">Popular Courses:</span>
      {courses.slice(0, 5).map((course) => (
        <button
          key={course.course_id}
          className="course-tag"
          onClick={() => handleCourseClick(course)}
          title={course.title}
        >
          {course.subject} {course.number}
        </button>
      ))}
    </div>
  )
}

export default CourseTags

