import { createContext, useContext, useState, useEffect } from 'react'
import { loginUser, getAuthToken, clearAuthData } from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem('synq_user')
    const token = getAuthToken()
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser))
    } else if (savedUser && !token) {
      // Clear user data if no token exists
      clearAuthData()
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const userData = await loginUser(username, password)
      setUser(userData)
      localStorage.setItem('synq_user', JSON.stringify(userData))
      return userData
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    clearAuthData()
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 