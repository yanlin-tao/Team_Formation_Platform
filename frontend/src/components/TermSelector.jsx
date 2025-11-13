import React from 'react'
import { HiAcademicCap, HiChevronDown } from 'react-icons/hi2'
import './TermSelector.css'

function TermSelector({ terms, selectedTermId, onTermChange, loading }) {
  const handleChange = (e) => {
    const value = e.target.value
    if (onTermChange) {
      onTermChange(value || null)
    }
  }

  return (
    <div className="term-selector-container">
      <div className="term-selector-label">
        <HiAcademicCap className="term-icon" />
        <span>Select Term:</span>
      </div>
      <div className="term-selector-wrapper">
        <select
          className="term-selector"
          value={selectedTermId || ''}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="">All Terms</option>
          {terms && terms.length > 0 ? (
            terms.map((term) => (
              <option key={term.term_id} value={term.term_id}>
                {term.name}
              </option>
            ))
          ) : (
            <option value="" disabled>No terms available</option>
          )}
        </select>
        <HiChevronDown className="term-selector-arrow" />
      </div>
    </div>
  )
}

export default TermSelector

