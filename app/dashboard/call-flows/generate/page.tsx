
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Wand2, ArrowLeft, Save, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { FlowchartCanvas } from '@/components/flowchart-builder/flowchart-canvas'
import { FullScreenContainer } from '@/components/layout/full-screen-container'
import { convertReactFlowToBland } from '@/services/reactflow-converter'
import type { Node, Edge } from 'reactflow'

interface ReactFlowData {
  nodes: Node[]
  edges: Edge[]
}

export default function GenerateCallFlowPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [generatedFlowchart, setGeneratedFlowchart] = useState<ReactFlowData | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your call flow')
      return
    }

    setIsGenerating(true)
    setError('')
    setGeneratedFlowchart(null)

    try {
      console.log('🚀 Generating call flow with prompt:', prompt)
      
      const response = await fetch('/api/generate-pathway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate call flow')
      }

      console.log('✅ Generated flowchart data:', result)
      setGeneratedFlowchart(result)
      toast.success('Call flow generated successfully!')

    } catch (err) {
      console.error('❌ Generation error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate call flow'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveAsPathway = async () => {
    if (!generatedFlowchart) {
      toast.error('No flowchart to save')
      return
    }

    setIsSaving(true)
    try {
      // Convert ReactFlow data to Bland.ai format
      const blandData = convertReactFlowToBland(generatedFlowchart)
      
      // Create pathway name from prompt
      const pathwayName = prompt.length > 50 
        ? `${prompt.substring(0, 47)}...` 
        : prompt

      console.log('💾 Saving pathway:', pathwayName)
      console.log('📊 Bland data:', blandData)

      const response = await fetch('/api/pathways/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: pathwayName,
          description: `Generated from prompt: ${prompt}`,
          flowchart_data: blandData,
          nodes: blandData.nodes,
          edges: blandData.edges
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save pathway')
      }

      toast.success('Pathway saved successfully!')
      router.push(`/dashboard/call-flows?saved=${result.pathway.id}`)

    } catch (err) {
      console.error('❌ Save error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save pathway'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadJson = () => {
    if (!generatedFlowchart) return

    const dataStr = JSON.stringify(generatedFlowchart, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'generated-call-flow.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('JSON file downloaded!')
  }

  const examplePrompts = [
    "Create a Medicare insurance qualification call flow that screens for eligibility and transfers qualified leads to an agent",
    "Build a healthcare appointment booking flow that collects symptoms, schedules appointments, and sends confirmations",
    "Design a sales qualification call for software demos that identifies decision makers and schedules product presentations",
    "Create a customer support flow that troubleshoots common issues and escalates complex problems to human agents",
    "Build a lead qualification flow for real estate that determines buying timeline and connects with local agents"
  ]

  return (
    <FullScreenContainer>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/call-flows")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Generate Call Flow with AI</h1>
              <p className="text-sm text-gray-600">Describe your call flow and let AI create it for you</p>
            </div>
          </div>

          {generatedFlowchart && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleDownloadJson}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Download JSON
              </Button>
              <Button 
                onClick={handleSaveAsPathway}
                disabled={isSaving}
                className="flex items-center gap-1"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save as Pathway
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 flex">
          {/* Input Panel */}
          <div className="w-96 p-4 border-r bg-gray-50 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  AI Flow Generator
                </CardTitle>
                <CardDescription>
                  Describe your desired call flow and AI will create a complete flowchart for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Call Flow Description</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Example: Create a Medicare insurance qualification call flow that screens for eligibility, asks about current coverage, handles objections, and transfers qualified leads to a specialist..."
                    rows={6}
                    className="mt-2"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Flow...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Call Flow
                    </>
                  )}
                </Button>

                {/* Example Prompts */}
                <div className="mt-6">
                  <Label className="text-sm font-medium">Example Prompts:</Label>
                  <div className="mt-2 space-y-2">
                    {examplePrompts.map((example, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full text-left h-auto p-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 whitespace-normal"
                        onClick={() => setPrompt(example)}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flowchart Canvas */}
          <div className="flex-1 relative">
            {!generatedFlowchart && !isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Wand2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Ready to Generate</h3>
                  <p className="text-gray-500">Enter a description and click "Generate Call Flow" to see your AI-powered flowchart</p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Generating Your Call Flow</h3>
                  <p className="text-gray-500">AI is creating your custom flowchart...</p>
                </div>
              </div>
            )}

            {generatedFlowchart && (
              <div className="h-full">
                <FlowchartCanvas 
                  initialNodes={generatedFlowchart.nodes}
                  initialEdges={generatedFlowchart.edges}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </FullScreenContainer>
  )
}
