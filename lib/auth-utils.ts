
import { cookies } from "next/headers"
import * as jwt from "jsonwebtoken"
import { Client } from "pg"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Get user from server-side request (for API routes) with proper cookie handling
export async function getUserFromRequest() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Get full user data from PostgreSQL
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })

    try {
      await client.connect()
      const result = await client.query(
        'SELECT id, email, name, role, company, phone_number, created_at, updated_at, last_login FROM users WHERE id = $1',
        [decoded.userId]
      )

      if (result.rows.length === 0) {
        return null
      }

      return result.rows[0]
    } finally {
      await client.end()
    }
  } catch (error) {
    console.error("Failed to get user from request:", error)
    return null
  }
}

// Check if user is authenticated (for API routes)
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUserFromRequest()
  return !!user
}

// Get user ID from server-side request (for API routes)
export async function getUserId(): Promise<string | null> {
  const user = await getUserFromRequest()
  return user?.id || null
}

// Get user with detailed error information
export async function getUserWithError() {
  try {
    const user = await getUserFromRequest()
    
    if (!user) {
      return {
        user: null,
        error: new Error("No authenticated user found")
      }
    }

    return { user, error: null }
  } catch (error) {
    console.error("Failed to get user from request:", error)
    return {
      user: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    }
  }
}

// Validate auth token (for API routes)
export async function verifyJWT(token: string): Promise<{ isValid: boolean; user: any; error?: string }> {
  return validateAuthToken(token)
}

export async function validateAuthToken(token?: string): Promise<{ isValid: boolean; user: any; error?: string }> {
  try {
    let authToken = token
    
    if (!authToken) {
      const cookieStore = await cookies()
      authToken = cookieStore.get("auth-token")?.value
    }

    if (!authToken) {
      return {
        isValid: false,
        user: null,
        error: "No auth token found"
      }
    }

    // Verify JWT token
    const decoded = jwt.verify(authToken, JWT_SECRET) as any
    
    const user = {
      id: decoded.userId,
      email: decoded.email
    }

    return {
      isValid: true,
      user,
      error: null
    }
  } catch (error) {
    console.error("Failed to validate auth token:", error)
    return {
      isValid: false,
      user: null,
      error: error instanceof Error ? error.message : "Token validation failed"
    }
  }
}
