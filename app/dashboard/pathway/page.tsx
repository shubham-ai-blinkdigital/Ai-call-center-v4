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

// Placeholder for pathways, assuming it will be fetched and set elsewhere or handled differently
let pathways: any[] = [];
const setPathways = (data: any[]) => {
  pathways = data;
};


export default function PathwayListingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Fetch pathways using API
        const pathwaysResponse = await fetch(`/api/pathways?creator_id=${user.id}`, {
          credentials: 'include'
        })

        if (pathwaysResponse.ok) {
          const pathwaysData = await pathwaysResponse.json()
          setPathways(pathwaysData.pathways || [])
        } else {
          console.error('Error fetching pathways:', pathwaysResponse.status)
          setError('Failed to load pathways')
        }

        // Fetch phone numbers using API
        const phoneResponse = await fetch('/api/user/phone-numbers', {
          credentials: 'include'
        })

        if (phoneResponse.ok) {
          const phoneData = await phoneResponse.json()
          setPhoneNumbers(phoneData.phoneNumbers || [])
        } else {
          console.error('Error fetching phone numbers:', phoneResponse.status)
          setError('Failed to load phone numbers')
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleManagePathway = (phoneNumber: string) => {
    const normalizedNumber = phoneNumber.replace(/\D/g, "")
    router.push(`/dashboard/pathway/${normalizedNumber}`)
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
          {phoneNumbers.map((number) => {
            return (
              <Card key={number.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{formatPhoneNumber(number.number)}</CardTitle>
                      <CardDescription>
                        {number.location || "Unknown Location"} • {number.type || "Voice"}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        number.status?.toLowerCase() === "active" || number.status?.toLowerCase() === "purchased"
                          ? "default"
                          : "outline"
                      }
                    >
                      {number.status || "Available"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="mr-2 h-4 w-4" />
                      <span>One pathway per phone number</span>
                    </div>

                    {/* Pathway ID Section */}
                    <div className="border-t pt-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">PATHWAY ID</div>
                          {number.pathway_id ? (
                            <div className="flex items-center gap-2">
                              <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-mono border border-green-200 flex-1 break-all">
                                {number.pathway_id}
                              </code>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 flex-shrink-0"
                                onClick={() => copyPathwayId(number.pathway_id)}
                              >
                                <Copy size={12} />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-sm">Not Assigned</span>
                          )}
                        </div>
                      </div>

                      {/* Pathway Name */}
                      {number.pathway_name && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            PATHWAY NAME
                          </div>
                          <span className="text-sm text-gray-700">{number.pathway_name}</span>
                        </div>
                      )}
                    </div>

                    {number.created_at && (
                      <div className="text-xs text-gray-500 border-t pt-2">
                        Purchased: {new Date(number.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => handleManagePathway(number.number)}
                  >
                    Manage Pathway
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
      <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Flowchart builder has been removed</p>
          </div>
    </div>
  )
}