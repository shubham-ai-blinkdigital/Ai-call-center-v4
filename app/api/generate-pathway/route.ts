import { type NextRequest, NextResponse } from "next/server"
import { convertApiToReactFlow, enhanceFlowchartLayout, ensureNodeConnections, validateApiData } from "@/utils/api-to-flowchart-converter"

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    console.log("🤖 Generating pathway with prompt:", prompt)

    // Call the OpenRouter API
    const response = await fetch(`${req.nextUrl.origin}/api/generate-pathway-openrouter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ OpenRouter API error:", errorData)
      return NextResponse.json(
        { 
          error: "Failed to generate pathway",
          details: errorData 
        },
        { status: response.status }
      )
    }

    const rawApiData = await response.json()
    console.log("✅ Raw API data received from OpenRouter")

    // Validate the API data structure
    if (!validateApiData(rawApiData)) {
      console.error("❌ Invalid API data structure:", rawApiData)
      return NextResponse.json(
        { 
          error: "Invalid pathway data structure from AI",
          details: "The AI generated an invalid flowchart structure"
        },
        { status: 500 }
      )
    }

    // Convert API data to ReactFlow format
    let reactFlowData = convertApiToReactFlow(rawApiData)

    // Enhance the layout for better visual presentation
    reactFlowData = enhanceFlowchartLayout(reactFlowData)

    // Ensure proper node connections
    reactFlowData = ensureNodeConnections(reactFlowData)

    console.log("✅ Pathway generated and converted successfully")

    return NextResponse.json(reactFlowData)

  } catch (error) {
    console.error("❌ Error in generate-pathway:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}