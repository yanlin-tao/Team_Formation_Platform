import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { registerUser, loginUser, persistSession } from '../services/api'
import './AuthPage.css'

function AuthPage() {
  const [mode, setMode] = useState('login')
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    netid: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const toggleMode = (value) => {
    setMode(value)
    setError(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      let response
      if (mode === 'register') {
        response = await registerUser({
          display_name: formData.display_name,
          email: formData.email,
          netid: formData.netid,
          password: formData.password,
        })
      } else {
        response = await loginUser({
          identifier: formData.email || formData.netid,
          password: formData.password,
        })
      }
      persistSession(response.token, response.user)
      navigate('/profile')
    } catch (err) {
      setError(err.message || 'Request failed. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Sidebar />
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => toggleMode('login')}
            >
              Log in
            </button>
            <button
              className={mode === 'register' ? 'active' : ''}
              onClick={() => toggleMode('register')}
            >
              Sign up
            </button>
          </div>

          <div className="auth-header">
            <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
            <p>
              {mode === 'login'
                ? 'Sign in with your TeamUp account. Password verification is temporarily bypassed.'
                : 'Share the basics to join the matching system. Password checks will be enabled later.'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="display_name">Display name</label>
                <input
                  id="display_name"
                  name="display_name"
                  type="text"
                  placeholder="e.g., Avery Chen"
                  value={formData.display_name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@illinois.edu"
                value={formData.email}
                onChange={handleChange}
                required={mode === 'register'}
              />
            </div>

            <div className="form-group">
              <label htmlFor="netid">NetID</label>
              <input
                id="netid"
                name="netid"
                type="text"
                placeholder="achen12"
                value={formData.netid}
                onChange={handleChange}
                required={mode === 'register'}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password (temporarily bypassed)"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <small>Passwords are accepted as-is for now; real checks will be added later.</small>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Submitting...' : mode === 'login' ? 'Log in' : 'Sign up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
