
import { NextResponse } from "next/server"
import { Client } from "pg"
import * as jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, company, phoneNumber } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ 
        success: false, 
        message: "Email, password, first name, and last name are required" 
      }, { status: 400 })
    }

    console.log("[AUTH/SIGNUP] Attempting external signup for:", email)

    // Call external API for signup
    const externalApiUrl = process.env.FOREX_URL || process.env.EXTERNAL_API_URL
    console.log("[AUTH/SIGNUP] Checking API URL - FOREX_URL:", process.env.FOREX_URL, "EXTERNAL_API_URL:", process.env.EXTERNAL_API_URL)
    
    if (!externalApiUrl) {
      console.error("[AUTH/SIGNUP] External API URL not configured")
      return NextResponse.json({
        success: false,
        message: "External API configuration missing. Please configure FOREX_URL environment variable."
      }, { status: 500 })
    }

    console.log("[AUTH/SIGNUP] Using external API URL:", externalApiUrl)

    const externalSignupData = {
      firstName,
      lastName,
      email,
      password,
      phoneNumber: phoneNumber || '',
      platform: "AI Call"
    }

    const apiEndpoint = `${externalApiUrl}/api/accounts/signup`
    console.log("[AUTH/SIGNUP] Calling external API:", apiEndpoint)
    console.log("[AUTH/SIGNUP] Payload:", JSON.stringify(externalSignupData, null, 2))
    
    const externalResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(externalSignupData)
    })

    let externalResult
    try {
      externalResult = await externalResponse.json()
    } catch (parseError) {
      console.error("[AUTH/SIGNUP] Failed to parse external API response:", parseError)
      console.log("[AUTH/SIGNUP] Raw response:", await externalResponse.text())
      return NextResponse.json({
        success: false,
        message: "Invalid response from signup service"
      }, { status: 500 })
    }

    if (!externalResponse.ok) {
      console.error("[AUTH/SIGNUP] External API error:", externalResult)
      return NextResponse.json({
        success: false,
        message: externalResult.message || "External signup failed"
      }, { status: externalResponse.status })
    }

    console.log("[AUTH/SIGNUP] External signup successful:", externalResult)

    // Store user data locally with unverified status
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })

    try {
      await client.connect()

      // Check if user already exists in local database
      const existingUser = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      )

      if (existingUser.rows.length > 0) {
        console.log("[AUTH/SIGNUP] User already exists locally:", email)
        return NextResponse.json({
          success: false,
          message: "User already exists"
        }, { status: 400 })
      }

      // Create local user record with external reference
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const insertResult = await client.query(
        `INSERT INTO users (id, email, first_name, last_name, company, phone_number, role, created_at, updated_at, external_id, external_token, is_verified, platform)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9, $10, $11)
         RETURNING *`,
        [
          userId,
          email,
          firstName,
          lastName,
          company || '',
          phoneNumber || '',
          'user',
          externalResult._id || externalResult.id,
          externalResult.token,
          false, // Not verified until email verification
          'AI Call'
        ]
      )

      const localUser = insertResult.rows[0]
      console.log("[AUTH/SIGNUP] Local user record created:", localUser.id)

      // Return success with verification required message
      return NextResponse.json({
        success: true,
        message: "Account created successfully. Please check your email for verification.",
        user: {
          id: localUser.id,
          email: localUser.email,
          firstName: localUser.first_name,
          lastName: localUser.last_name,
          company: localUser.company,
          phoneNumber: localUser.phone_number,
          isVerified: false,
          requiresVerification: true
        }
      })

    } finally {
      await client.end()
    }

  } catch (error: any) {
    console.error("[AUTH/SIGNUP] Error:", error)
    
    // Handle specific external API errors
    if (error.message?.includes('fetch')) {
      return NextResponse.json({
        success: false,
        message: "Unable to connect to signup service. Please try again later."
      }, { status: 503 })
    }

    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 })
  }
}
