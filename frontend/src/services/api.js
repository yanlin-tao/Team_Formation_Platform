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
      throw new Error(`API error: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

export async function fetchPopularPosts() {
  return apiRequest('/posts/popular')
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

export async function searchCourses(query) {
  return apiRequest(`/courses/search?q=${encodeURIComponent(query)}`)
}

