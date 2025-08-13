
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

        // Fetch pathways for additional details if needed
        const pathwaysResponse = await fetch('/api/pathways', {
          credentials: 'include'
        })

        if (pathwaysResponse.ok) {
          const pathwaysData = await pathwaysResponse.json()
          console.log('✅ [PATHWAY-PAGE] Pathways loaded:', pathwaysData)
          setPathways(pathwaysData || [])
        } else {
          console.warn('⚠️ [PATHWAY-PAGE] Could not fetch pathways, but phone numbers loaded successfully')
        }

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Pathways</h1>
          <p className="text-gray-600">
            Manage call flow pathways for your phone numbers
            {user && <span className="text-xs ml-2 text-gray-400">(User: {user.email})</span>}
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Phone Numbers Found</h3>
            <p className="text-gray-600 text-center mb-6">
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
            // Use pathway info from phone_numbers table (which comes from the JOIN in the API)
            const hasPathway = phone.pathway_id && phone.pathway_name
            
            return (
              <Card key={phone.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{phone.number}</span>
                        <Badge variant={phone.status === "active" ? "default" : "secondary"}>
                          {phone.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {phone.location} • {phone.type}
                      </p>
                      {hasPathway ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span className="text-green-700">
                              Pathway: {phone.pathway_name}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyPathwayId(phone.pathway_id!)}
                              title="Copy Pathway ID"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          {phone.pathway_description && (
                            <p className="text-xs text-gray-500 ml-4">
                              {phone.pathway_description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 ml-4">
                            ID: {phone.pathway_id}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                          <span className="text-gray-500">No pathway configured</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManagePathway(phone.number)}
                    className="w-full"
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
