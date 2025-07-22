const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const LOGIN_URL = import.meta.env.VITE_LOGIN_URL

export const loginUser = async (username, password) => {
  try {
    const formData = new URLSearchParams()
    formData.append('grant_type', '')
    formData.append('username', username)
    formData.append('password', password)

    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })

    if (!response.ok) {
      // Don't trigger logout for login failures
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Store the token
    localStorage.setItem('synq_token', data.token || data.access_token)

    // Create user object from response
    const userData = {
      id: data.user?.id || data.id,
      username: data.user?.username || username,
      name: data.user?.name || data.name || username,
      email: data.user?.email || data.email || `${username}@synq.com`,
      role: data.user?.role || data.role || 'user',
      token: data.token || data.access_token
    }

    return userData
  } catch (error) {
    console.error('Login error:', error)
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your connection.')
    }
    throw error
  }
}

export const getAuthToken = () => {
  return localStorage.getItem('synq_token')
}

export const clearAuthData = () => {
  localStorage.removeItem('synq_user')
  localStorage.removeItem('synq_token')
}

export const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = getAuthToken()
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  })

  if (!response.ok) {
    // Handle 401 Unauthorized - trigger logout
    if (response.status === 401) {
      clearAuthData()
      // Dispatch a custom event to notify the app about logout
      window.dispatchEvent(new CustomEvent('auth:logout', { 
        detail: { reason: 'unauthorized' } 
      }))
      throw new Error('Session expired. Please log in again.')
    }
    
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const getDashboards = async () => {
  return makeAuthenticatedRequest('/dashboards')
}

export const createDashboard = async (dashboardData) => {
  return makeAuthenticatedRequest('/dashboards', {
    method: 'POST',
    body: JSON.stringify(dashboardData)
  })
}

export const getIntegrations = async () => {
  return makeAuthenticatedRequest('/apps')
}

export const getDashboardById = async (dashboardId) => {
  return makeAuthenticatedRequest(`/dashboards/${dashboardId}`)
}

export const updateDashboardNotes = async (dashboardId, notes) => {
  return makeAuthenticatedRequest(`/dashboards/${dashboardId}/notes`, {
    method: 'PUT',
    body: JSON.stringify({ notes })
  })
} 