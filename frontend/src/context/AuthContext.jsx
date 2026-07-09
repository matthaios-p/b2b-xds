import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function decodeJwt(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    // Base64url -> base64
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch (err) {
    console.warn('Failed to decode token', err)
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const t = localStorage.getItem('token')
        if (t) {
          const payload = decodeJwt(t)
          if (payload && payload.exp && Date.now() / 1000 < payload.exp) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
            setToken(t)
            // prefer user from token
            const userFromToken = { id: payload.userId, email: payload.email, role: payload.role }
            setUser(userFromToken)
            localStorage.setItem('user', JSON.stringify(userFromToken))
          } else {
            // token expired
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            delete axios.defaults.headers.common['Authorization']
            setToken(null)
            setUser(null)
          }
        }
      } catch (err) {
        console.error('Auth init error', err)
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password })
      if (res.data && res.data.token) {
        const t = res.data.token
        const userObj = res.data.user || decodeJwt(t)
        localStorage.setItem('token', t)
        localStorage.setItem('user', JSON.stringify(userObj))
        axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
        setToken(t)
        setUser(userObj)
        return { success: true }
      }
      return { success: false, error: 'Invalid response from server' }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  const register = async (name, email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, { name, email, password })
      if (res.data && res.data.token) {
        const t = res.data.token
        const userObj = res.data.user || decodeJwt(t)
        localStorage.setItem('token', t)
        localStorage.setItem('user', JSON.stringify(userObj))
        axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
        setToken(t)
        setUser(userObj)
        return { success: true }
      }
      return { success: false, error: 'Invalid response from server' }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message }
    }
  }

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    register
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
