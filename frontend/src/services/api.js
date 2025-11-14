const API_BASE_URL = '/api'

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `API error: ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch (e) {
        // If response is not JSON, use status text
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

export async function sendJoinRequest(postId, message) {
  return apiRequest('/requests', {
    method: 'POST',
    body: JSON.stringify({
      post_id: postId,
      message: message,
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
  const url = `/posts/search?${params.toString()}`
  console.log('[API] searchPosts URL:', url)
  try {
    const result = await apiRequest(url)
    console.log('[API] searchPosts result:', result)
    return result
  } catch (error) {
    console.error('[API] searchPosts error:', error)
    throw error
  }
}

