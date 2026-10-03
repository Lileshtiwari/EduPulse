import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../lib/api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginInit: (email: string, password: string) => Promise<{ status: string; email: string; message: string; role?: string }>
  verifyOtp: (email: string, otp: string) => Promise<User>
  resendOtp: (email: string) => Promise<{ status: string; email: string; message: string }>
  logout: () => void
  updateUser: (updatedUser: User) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('edupulse_token')
    const storedUser = localStorage.getItem('edupulse_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem('edupulse_token', access_token)
    localStorage.setItem('edupulse_user', JSON.stringify(userData))
    setToken(access_token)
    setUser(userData)
  }

  const loginInit = async (email: string, password: string) => {
    const res = await api.post('/auth/login-init', { email, password })
    return res.data
  }

  const verifyOtp = async (email: string, otp: string) => {
    const res = await api.post('/auth/verify-otp', { email, otp })
    const { access_token, user: userData } = res.data
    localStorage.setItem('edupulse_token', access_token)
    localStorage.setItem('edupulse_user', JSON.stringify(userData))
    setToken(access_token)
    setUser(userData)
    return userData
  }

  const resendOtp = async (email: string) => {
    const res = await api.post('/auth/resend-otp', { email })
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('edupulse_token')
    localStorage.removeItem('edupulse_user')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('edupulse_user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginInit, verifyOtp, resendOtp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
