import React, { useState } from 'react'
import './SearchBar.css'

function SearchBar({ onSearch }) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          className="search-input"
          placeholder="Search courses by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="search-button">
          🔍 Search
        </button>
      </form>
      <div className="course-tags">
        <span className="tag-label">Popular:</span>
        <button className="course-tag">CS 411</button>
        <button className="course-tag">ECE 391</button>
        <button className="course-tag">CS 225</button>
        <button className="course-tag">MATH 241</button>
      </div>
    </div>
  )
}

export default SearchBar

