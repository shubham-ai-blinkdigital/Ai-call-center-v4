"use client"

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export interface User {
  id: string
  email?: string | null
  name?: string | null
  company?: string | null
  phoneNumber?: string | null
  role?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  signup: (data: SignupData) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message: string }>
  isAuthenticated: boolean
}

export interface SignupData {
  email: string
  password: string
  name: string
  company?: string
  phoneNumber?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const isAuthenticated = !!user
  const initializedRef = useRef(false)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = async () => {
    console.log("🔄 [AUTH-CONTEXT] Checking authentication...")
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        console.log("🔍 [AUTH-CONTEXT] Auth response data:", data)

        // Expect direct user object
        const userData = data.user

        if (userData && typeof userData === 'object' && userData.id) {
          console.log("✅ [AUTH-CONTEXT] User authenticated:", userData.id, userData.email)
          setUser(userData)
          setLoading(false)
          return
        }

        console.log("❌ [AUTH-CONTEXT] No valid user data in response", { userData, rawData: data })
      } else {
        setUser(null)
        console.log("❌ [AUTH-CONTEXT] Auth check failed:", response.status)
      }
    } catch (error: any) {
      console.error("❌ [AUTH-CONTEXT] Auth check error:", error.message)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Initialize auth context
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    console.log("🔄 [AUTH-CONTEXT] Initializing auth context...")

    checkAuth().finally(() => {
      setLoading(false)
      setIsInitialized(true)
    })

    return () => {
      initializedRef.current = false
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log("🔄 [AUTH-CONTEXT] Starting login for:", email)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (!result.success) {
        console.error("❌ [AUTH-CONTEXT] Login error:", result.message)
        return { success: false, message: result.message }
      }

      console.log("✅ [AUTH-CONTEXT] Login successful")

      // Update user state
      setUser(result.user)

      // Redirect to dashboard
      router.push("/dashboard")

      return { success: true, message: "Login successful" }
    } catch (error: any) {
      console.error("❌ [AUTH-CONTEXT] Unexpected login error:", error)
      return { success: false, message: error.message || "An unexpected error occurred" }
    }
  }

  const signup = async (data: SignupData) => {
    try {
      console.log("🔄 [AUTH-CONTEXT] Starting signup for:", data.email)

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        console.error("❌ [AUTH-CONTEXT] Signup error:", result.message)
        return { success: false, message: result.message }
      }

      console.log("✅ [AUTH-CONTEXT] Signup successful")

      // Update user state
      setUser(result.user)

      // Redirect to dashboard
      router.push("/dashboard")

      return { success: true, message: "Account created successfully" }
    } catch (error: any) {
      console.error("❌ [AUTH-CONTEXT] Unexpected signup error:", error)
      return { success: false, message: error.message || "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      setUser(null)
      router.push("/login")
    } catch (err) {
      console.error("Logout error:", err)
      setUser(null)
      router.push("/login")
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) {
        return { success: false, message: "Not logged in" }
      }

      console.log("🔄 [AUTH-CONTEXT] Updating profile for user:", user.id)

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        console.error("❌ [AUTH-CONTEXT] Profile update error:", result.message)
        return { success: false, message: result.message }
      }

      // Update local state
      setUser((prev) => (prev ? { ...prev, ...data } : null))

      console.log("✅ [AUTH-CONTEXT] Profile updated successfully")
      return { success: true, message: "Profile updated successfully" }
    } catch (error: any) {
      console.error("❌ [AUTH-CONTEXT] Unexpected profile update error:", error)
      return { success: false, message: error.message || "An unexpected error occurred" }
    }
  }

  // Prevent hydration mismatch by waiting for initialization
  if (!isInitialized && loading) {
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}