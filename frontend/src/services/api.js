const API_BASE_URL = '/api'

function getStoredToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('teamup_token')
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, config)
    if (!response.ok) {
      let errorMessage = `API error: ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch (e) {
        // response not JSON
      }
      const error = new Error(errorMessage)
      error.response = response
      throw error
    }
    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    console.error('API request details:', { url, config, error: error.message })
    throw error
  }
}

export async function fetchTerms() {
  return apiRequest('/terms')
}

export async function fetchPopularPosts(termId = null) {
  const url = termId ? `/posts/popular?term_id=${encodeURIComponent(termId)}` : '/posts/popular'
  return apiRequest(url)
}

export async function fetchPostById(postId) {
  return apiRequest(`/posts/${postId}`)
}

export async function fetchComments(postId) {
  return apiRequest(`/posts/${postId}/comments`)
}

export async function createComment(postId, payload) {
  return apiRequest(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function sendJoinRequest(postId, message) {
  return apiRequest('/requests', {
    method: 'POST',
    body: JSON.stringify({
      post_id: postId,
      message,
    }),
  })
}

export async function searchCourses(termId, query) {
  const params = new URLSearchParams()
  if (termId) params.append('term_id', termId)
  if (query) params.append('q', query)
  params.append('limit', '50')
  return apiRequest(`/courses/search?${params.toString()}`)
}

export async function getPopularCourses(termId) {
  const params = new URLSearchParams()
  if (termId) params.append('term_id', termId)
  params.append('limit', '5')
  return apiRequest(`/courses/popular?${params.toString()}`)
}

export async function searchPosts(termId, courseId) {
  if (!termId || !courseId) {
    throw new Error('Both termId and courseId are required')
  }
  const params = new URLSearchParams()
  params.append('term_id', termId)
  params.append('course_id', courseId)
  params.append('limit', '100')
  return apiRequest(`/posts/search?${params.toString()}`)
}

export async function registerUser(payload) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function loginUser(payload) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchCurrentUser(userId, identifier) {
  const params = new URLSearchParams()
  if (userId) params.append('user_id', userId)
  if (!userId && identifier) params.append('identifier', identifier)
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest(`/auth/me${query}`)
}

export async function fetchProfile(userId) {
  const params = new URLSearchParams()
  if (userId) params.append('user_id', userId)
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest(`/profile/me${query}`)
}

export async function logoutUser() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' })
  } catch (err) {
    console.warn('[API] logout warning:', err.message)
  } finally {
    clearSession()
  }
}

export function persistSession(token, user) {
  if (typeof window === 'undefined') return
  localStorage.setItem('teamup_token', token)
  localStorage.setItem('teamup_user', JSON.stringify(user))
}

export function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('teamup_token')
  localStorage.removeItem('teamup_user')
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('teamup_user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed to parse stored user', err)
    return null
  }
}
