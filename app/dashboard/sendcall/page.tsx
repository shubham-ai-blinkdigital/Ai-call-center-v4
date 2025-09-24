
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Phone, 
  Send, 
  FileText, 
  Users, 
  Building, 
  Stadium, 
  TrendingUp,
  Bookmark,
  ArrowUpRight
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface Pathway {
  id: string
  name: string
  description: string
}

interface Voice {
  voice_id: string
  name: string
  preview_url?: string
}

export default function SendCallPage() {
  const { user } = useAuth()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedVoice, setSelectedVoice] = useState("")
  const [prompt, setPrompt] = useState("")
  const [pathways, setPathways] = useState<Pathway[]>([])
  const [voices, setVoices] = useState<Voice[]>([])
  const [selectedPathway, setSelectedPathway] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Sample prompts for quick selection
  const savedPrompts = [
    { id: "saved", name: "Saved Prompts", icon: Bookmark },
    { id: "telehealth", name: "Telehealth", icon: Users },
    { id: "small-business", name: "Small business", icon: Building },
    { id: "stadium", name: "Stadium venues", icon: Stadium },
    { id: "inbound-sales", name: "Inbound sales", icon: TrendingUp },
  ]

  // Fetch user pathways and voices
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      try {
        setLoadingData(true)
        
        // Fetch pathways
        const pathwaysResponse = await fetch('/api/pathways', {
          credentials: 'include'
        })
        if (pathwaysResponse.ok) {
          const pathwaysData = await pathwaysResponse.json()
          setPathways(pathwaysData.pathways || [])
        }

        // Fetch voices
        const voicesResponse = await fetch('/api/bland-ai/voices', {
          credentials: 'include'
        })
        if (voicesResponse.ok) {
          const voicesData = await voicesResponse.json()
          setVoices(voicesData.voices || [])
          // Set default voice to first available or "June"
          if (voicesData.voices?.length > 0) {
            const juneVoice = voicesData.voices.find((v: Voice) => v.name === "June")
            setSelectedVoice(juneVoice?.voice_id || voicesData.voices[0].voice_id)
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load data')
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [user?.id])

  const handleSendCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number')
      return
    }

    if (!selectedPathway && !prompt.trim()) {
      toast.error('Please select a pathway or enter a prompt')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/bland-ai/send-test-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          pathwayId: selectedPathway || undefined,
          task: prompt || undefined,
          voiceId: selectedVoice || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Call initiated successfully!')
        // Reset form
        setPhoneNumber("")
        setPrompt("")
        setSelectedPathway("")
      } else {
        toast.error(data.error || 'Failed to send call')
      }
    } catch (error) {
      console.error('Error sending call:', error)
      toast.error('Failed to send call')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePromptSelect = (promptType: string) => {
    const prompts = {
      telehealth: "You are a helpful telehealth assistant. Help the patient with their healthcare needs and schedule appointments as needed.",
      "small-business": "You are a business assistant helping with customer inquiries, scheduling, and general business support.",
      stadium: "You are a stadium customer service representative helping with tickets, events, and venue information.",
      "inbound-sales": "You are a sales representative helping potential customers learn about our products and services.",
    }
    
    if (prompts[promptType as keyof typeof prompts]) {
      setPrompt(prompts[promptType as keyof typeof prompts])
    }
  }

  if (loadingData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Send Call</h1>
            <p className="text-muted-foreground">Enter a phone number and a prompt to get started</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Send Call</h1>
          <p className="text-muted-foreground">Enter a phone number and a prompt to get started</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="#" className="flex items-center gap-2">
              Read Docs
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline">
            Hide code
          </Button>
          <Button variant="outline">
            JSON Mode
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Basic
              </CardTitle>
              <CardDescription>
                Enter a phone number and a prompt to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex">
                  <Select defaultValue="+91">
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+91">🇮🇳 +91</SelectItem>
                      <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      <SelectItem value="+49">🇩🇪 +49</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    placeholder="88796-13417"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Voice Selection */}
              <div className="space-y-2">
                <Label htmlFor="voice">Voice</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.voice_id} value={voice.voice_id}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs text-white">
                            {voice.name.charAt(0)}
                          </div>
                          {voice.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Prompt or Pathway Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant={selectedPathway ? "outline" : "default"}
                    className="flex-1"
                    onClick={() => setSelectedPathway("")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Prompt
                  </Button>
                  <Button
                    variant={selectedPathway ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setPrompt("")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Pathway
                  </Button>
                </div>

                {selectedPathway ? (
                  <div className="space-y-2">
                    <Label>Select Pathway</Label>
                    <Select value={selectedPathway} onValueChange={setSelectedPathway}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a pathway" />
                      </SelectTrigger>
                      <SelectContent>
                        {pathways.map((pathway) => (
                          <SelectItem key={pathway.id} value={pathway.id}>
                            {pathway.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    {/* Saved Prompts */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {savedPrompts.map((promptType) => (
                          <Button
                            key={promptType.id}
                            variant="outline"
                            size="sm"
                            onClick={() => handlePromptSelect(promptType.id)}
                            className="h-8"
                          >
                            <promptType.icon className="h-3 w-3 mr-1" />
                            {promptType.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Prompt Text Area */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Enter a prompt for the call"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <Button variant="link" className="h-auto p-0 text-blue-600">
                          Prompting Guide
                          <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* First Sentence */}
              <div className="space-y-2">
                <Label>First Sentence</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-3 w-3 mr-1" />
                    Presets
                  </Button>
                </div>
              </div>

              {/* Send Button */}
              <Button 
                onClick={handleSendCall} 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? "Sending..." : "Send Call"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Code Preview */}
        <div className="space-y-6">
          <Card className="bg-slate-900 text-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">JavaScript</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs font-mono overflow-auto">
                <code>{`// Headers
const headers = {
  'Authorization': 'API_KEY',
};

// Data
const data = {
  "phone_number": "${phoneNumber || '+918879613417'}",
  "voice": "${voices.find(v => v.voice_id === selectedVoice)?.name || 'June'}",
  "wait_for_greeting": false,
  "record": true,
  "answered_by_enabled": true,
  "noise_cancellation": false,
  "interruption_threshold": 100,
  "block_interruptions": false,
  "max_duration": 12,
  "model": "base",
  "language": "en",
  "background_track": "none",
  "endpoint": "https://api.bland.ai",
  "voicemail_action": "hangup"
};

// API request
await axios.post('https://api.bland.ai/v1/calls', data, {headers});`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
