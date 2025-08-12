import { NextResponse } from "next/server"
import { Client } from "pg"
import * as bcrypt from "bcryptjs"
import * as jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: Request) {
  try {
    const { email, password, name, company, phoneNumber } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: "Email and password are required" 
      }, { status: 400 })
    }

    console.log("[AUTH/SIGNUP] Attempting signup for:", email)

    // Check if user already exists
    const existingUser = await db.get(`user:${email}`)
    if (existingUser) {
      console.log("[AUTH/SIGNUP] User already exists:", email)
      return NextResponse.json({ 
        success: false, 
        message: "Email already exists" 
      }, { status: 400 })
    }

    // Store password as plain text
    const passwordHash = password

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const user = {
      id: userId,
      email,
      name: name || email,
      company: company || null,
      phoneNumber: phoneNumber || null,
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      passwordHash
    }

    // Save user to database
    await db.set(`user:${email}`, user)
    await db.set(`userId:${userId}`, email) // For reverse lookup

    console.log("[AUTH/SIGNUP] User created successfully:", email)

    // Create JWT token
    const token = jwt.sign(
      { 
        userId, 
        email,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      },
      JWT_SECRET
    )

    // Set HTTP-only cookie
    const cookieStore = cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    // Return user data (without password)
    const { passwordHash: _, ...safeUser } = user
    return NextResponse.json({
      success: true,
      user: safeUser
    })

  } catch (error: any) {
    console.error("[AUTH/SIGNUP] Error:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 })
  }
}