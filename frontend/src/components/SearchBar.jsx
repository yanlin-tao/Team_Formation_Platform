import React, { useState, useEffect, useRef } from 'react'
import { HiMagnifyingGlass, HiXMark, HiChevronDown } from 'react-icons/hi2'
import './SearchBar.css'

function SearchBar({ termId, onSearch, onCourseSelect }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [loading, setLoading] = useState(false)
  const searchBarRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Search for courses when query changes
  useEffect(() => {
    const searchCourses = async () => {
      if (!termId || !searchQuery.trim()) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      // Only search if query has at least 2 characters
      if (searchQuery.trim().length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      try {
        setLoading(true)
        const { searchCourses } = await import('../services/api')
        const results = await searchCourses(termId, searchQuery.trim())
        setSuggestions(results || [])
        // Only show suggestions if user is still typing and has results
        if (results && results.length > 0 && searchQuery.trim().length >= 2) {
          setShowSuggestions(true)
        } else {
          setShowSuggestions(false)
        }
      } catch (err) {
        console.error('Error searching courses:', err)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setLoading(false)
      }
    }

    // Debounce search
    const timeoutId = setTimeout(searchCourses, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, termId])

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    setSelectedCourse(null)
    // Only show suggestions when user is actively typing
    if (value.trim().length >= 2) {
      // Suggestions will be shown when they load
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  const handleCourseSelect = (course) => {
    setSelectedCourse(course)
    setSearchQuery(`${course.subject} ${course.number} - ${course.title}`)
    setShowSuggestions(false)
    if (onCourseSelect) {
      onCourseSelect(course)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setShowSuggestions(false) // Hide suggestions when submitting
    
    if (selectedCourse) {
      // Use selected course
      if (onSearch) {
        onSearch(selectedCourse)
      }
      return
    }

    if (!searchQuery.trim() || !termId) {
      return
    }

    // If no selected course, search for the best match
    // Backend already returns results sorted by match relevance, so use the first one
    try {
      const { searchCourses } = await import('../services/api')
      const results = await searchCourses(termId, searchQuery.trim())
      
      if (results && results.length > 0) {
        // Backend returns results sorted by match relevance, so the first one is the best match
        const bestMatch = results[0]
        if (bestMatch && onSearch) {
          setSelectedCourse(bestMatch)
          onSearch(bestMatch)
        }
      }
    } catch (err) {
      console.error('Error searching courses:', err)
    }
  }

  const handleClear = () => {
    setSearchQuery('')
    setSelectedCourse(null)
    setSuggestions([])
    setShowSuggestions(false)
    if (onSearch) {
      onSearch(null)
    }
  }

  return (
    <div className="search-bar-container" ref={searchBarRef}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <HiMagnifyingGlass className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search courses by name or code..."
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => {
              // Only show suggestions if user has typed at least 2 characters
              if (suggestions.length > 0 && searchQuery.trim().length >= 2) {
                setShowSuggestions(true)
              }
            }}
            disabled={!termId}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-button"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <HiXMark />
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown" ref={suggestionsRef}>
              {suggestions.map((course) => (
                <div
                  key={course.course_id}
                  className="suggestion-item"
                  onClick={() => handleCourseSelect(course)}
                >
                  <div className="suggestion-course-code">
                    {course.subject} {course.number}
                  </div>
                  <div className="suggestion-course-title">{course.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="search-button"
          disabled={!termId || !searchQuery.trim()}
        >
          <HiMagnifyingGlass className="button-icon" />
          Search
        </button>
      </form>
    </div>
  )
}

export default SearchBar

