import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { phoneNumber, pathwayId, task, voiceId } = await request.json()

    // Validate inputs
    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    if (!pathwayId && !task) {
      return NextResponse.json({ error: "Either pathway ID or task is required" }, { status: 400 })
    }

    // Format phone number to E.164 format if needed
    const formattedPhoneNumber = phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber.replace(/\D/g, "")}`

    // Get the API key from environment variables
    const apiKey = process.env.BLAND_AI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Prepare call data
    const callData: any = {
      phone_number: formattedPhoneNumber,
      wait_for_greeting: false,
      record: true,
      answered_by_enabled: true,
      noise_cancellation: false,
      interruption_threshold: 100,
      block_interruptions: false,
      max_duration: 12,
      model: "base",
      language: "en",
      background_track: "none",
      voicemail_action: "hangup"
    }

    // Add pathway or task
    if (pathwayId) {
      callData.pathway_id = pathwayId
    } else if (task) {
      callData.task = task
    }

    // Add voice if specified
    if (voiceId) {
      callData.voice_id = voiceId
    }

    // Call the Bland.ai API to initiate the call
    const response = await fetch("https://api.bland.ai/v1/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(callData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        {
          error: "Failed to initiate call with Bland.ai",
          details: errorData,
        },
        { status: response.status },
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      callId: data.call_id,
      message: "Test call initiated successfully",
    })
  } catch (error) {
    console.error("Error sending test call:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
