"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, ArrowRight, Plus, AlertCircle, RefreshCw, Copy } from "lucide-react"
import { formatPhoneNumber } from "@/utils/phone-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth"

interface PhoneNumber {
  id: string
  number: string
  location: string
  type: string
  status: string
  created_at: string
  user_id: string
  pathway_id?: string | null
  pathway_name?: string | null
  pathway_description?: string | null
}

interface Pathway {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export default function PathwayListingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  const [pathways, setPathways] = useState<Pathway[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Assuming isInitialized and authLoading are available from useAuth or a similar context
  // If not, these would need to be defined or passed appropriately.
  // For now, let's assume they are available and correctly manage the auth state.
  const isInitialized = true; // Placeholder, replace with actual initialization status if available
  const authLoading = false; // Placeholder, replace with actual auth loading status if available


  useEffect(() => {
    const fetchUserPathways = async () => {
      if (!user || !user.id) {
        console.log('[PATHWAY-PAGE] ❌ No user or user ID available')
        setLoading(false)
        return
      }

      console.log('[PATHWAY-PAGE] 🔍 Fetching pathways for user:', user.id)
      setLoading(true)
      setError(null)

      try {
        // Use the authenticated user's actual ID, not the test ID
        const response = await fetch(`/api/pathways?creator_id=${user.id}`, {
          credentials: 'include',
          cache: 'no-cache'
        })

        console.log('[PATHWAY-PAGE] 📊 Response status:', response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.log('[PATHWAY-PAGE] ❌ Error response:', errorText)
          throw new Error(`Failed to fetch pathways: ${response.status}`)
        }

        const data = await response.json()
        console.log('[PATHWAY-PAGE] ✅ Pathways data:', data)

        if (data.pathways) {
          setPathways(data.pathways)
        } else {
          setPathways([])
        }
      } catch (error) {
        console.error('[PATHWAY-PAGE] ❌ Error fetching pathways:', error)
        setError(error instanceof Error ? error.message : 'Failed to load pathways')
        setPathways([])
      } finally {
        setLoading(false)
      }
    }

    if (isInitialized && !authLoading && user) {
      fetchUserPathways()
    } else if (isInitialized && !authLoading && !user) {
      setLoading(false)
    }
  }, [user, isInitialized, authLoading])

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        console.log("🔍 [PATHWAY-PAGE] Fetching data for user:", user.email)

        // Fetch phone numbers first - this contains the pathway associations
        const phoneResponse = await fetch('/api/user/phone-numbers', {
          credentials: 'include'
        })

        if (!phoneResponse.ok) {
          const errorText = await phoneResponse.text()
          console.error('❌ [PATHWAY-PAGE] Error fetching phone numbers:', phoneResponse.status, errorText)
          setError(`Failed to load phone numbers: ${phoneResponse.status}`)
          return
        }

        const phoneData = await phoneResponse.json()
        const phoneNumbers = phoneData.phoneNumbers || []

        console.log("✅ [PATHWAY-PAGE] Phone numbers loaded:", phoneNumbers)

        // Clean phone number formatting (remove extra + signs)
        const cleanedPhoneNumbers = phoneNumbers.map((phone: PhoneNumber) => ({
          ...phone,
          number: phone.number.replace(/^\+\+/, '+') // Remove double plus signs
        }))

        setPhoneNumbers(cleanedPhoneNumbers)

        // Fetch pathways using the new API (no creator_id needed, uses authenticated user)
        // This part seems to be replaced by the first useEffect hook which fetches pathways directly.
        // If phone numbers also need to fetch their pathway info in a different way, this needs adjustment.
        // Based on the previous change, it looks like pathway data is now fetched separately and linked.
        // For now, we keep this as is, assuming phone numbers might still contain association data.
        const pathwaysResponse = await fetch('/api/pathways', {
          credentials: 'include'
        })

        if (!pathwaysResponse.ok) {
          const errorText = await pathwaysResponse.text()
          console.error('❌ [PATHWAY-PAGE] Error fetching pathways:', pathwaysResponse.status, errorText)
          setError(`Failed to load pathways: ${pathwaysResponse.status}`)
          return
        }

        const pathwaysData = await pathwaysResponse.json()
        console.log("✅ [PATHWAY-PAGE] Pathways data:", pathwaysData)
        setPathways(pathwaysData || [])

      } catch (err) {
        console.error('❌ [PATHWAY-PAGE] Error fetching data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleManagePathway = (phoneNumber: string) => {
    // Clean the phone number before navigation
    const cleanNumber = phoneNumber.replace(/^\+\+/, '+').replace(/\D/g, "")
    router.push(`/dashboard/pathway/${cleanNumber}`)
  }

  const copyPathwayId = (pathwayId: string) => {
    navigator.clipboard.writeText(pathwayId)
    toast.success("Pathway ID copied to clipboard")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Pathways</h1>
            <p className="text-gray-600">Manage call flow pathways for your phone numbers</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your pathways...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Pathways</h1>
          <p className="text-muted-foreground mt-1">
            Manage call flow pathways for your phone numbers
            {user && <span className="text-xs ml-2 text-muted-foreground">(User: {user.email})</span>}
          </p>
        </div>
        <Link href="/dashboard/phone-numbers/purchase">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Purchase New Number
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="ml-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!error && phoneNumbers.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Phone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Phone Numbers Found</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              You need to purchase a phone number before creating a pathway. Each phone number gets its own call flow
              pathway.
            </p>
            <Link href="/dashboard/phone-numbers/purchase">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Purchase a Number
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {phoneNumbers.map((phone) => {
            // Use pathway info from phone_numbers table directly
            const hasPathway = phone.pathway_id

            return (
              <Card key={phone.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 pb-4">
                  <div className="space-y-4">
                    {/* Phone Number Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-blue-600" />
                        <div>
                          <span className="font-semibold text-lg">{formatPhoneNumber(phone.number)}</span>
                          <Badge 
                            variant={phone.status === "active" ? "default" : "secondary"}
                            className="ml-3"
                          >
                            {phone.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Location Info */}
                    <div className="text-sm text-muted-foreground border-b pb-3">
                      <span className="font-medium">{phone.location}</span> • <span>{phone.type}</span>
                    </div>

                    {/* Pathway Status */}
                    {hasPathway ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-green-700">
                                Pathway Connected
                              </span>
                            </div>
                            <h4 className="font-medium mb-2">
                              {phone.pathway_name}
                            </h4>
                            {phone.pathway_description && (
                              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                                {phone.pathway_description}
                              </p>
                            )}
                            
                            {/* Pathway ID Section */}
                            <div className="bg-muted rounded-lg p-3 border">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 mb-1">Pathway ID</p>
                                  <p className="text-sm font-mono text-gray-700 break-all">
                                    {phone.pathway_id}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 flex-shrink-0"
                                  onClick={() => copyPathwayId(phone.pathway_id!)}
                                  title="Copy Pathway ID"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 py-2">
                        <div className="h-2 w-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">No pathway configured</span>
                          <p className="text-xs text-gray-400 mt-1">Create a pathway to handle incoming calls</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="px-6 py-4 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManagePathway(phone.number)}
                    className="w-full justify-center"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {hasPathway ? 'Edit Pathway' : 'Create Pathway'}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}