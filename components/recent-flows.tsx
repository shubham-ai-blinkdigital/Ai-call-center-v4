"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function RecentFlows() {
  const { user, isAuthenticated } = useAuth()
  const [flows, setFlows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadFlows() {
      try {
        setLoading(true)
        setError(null)

        if (!isAuthenticated || !user) {
          console.error("[RECENT-FLOWS] No authenticated user")
          setError("No authenticated user found. Please log in.")
          return
        }

        // Fetch user's pathways from the API route
        const response = await fetch(`/api/pathways`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[RECENT-FLOWS] API error response:", response.status, errorText);
          throw new Error(`Failed to fetch pathways: ${response.status}`);
        }

        const data = await response.json();

        setFlows(data || [])
      } catch (error) {
        console.error("Error loading recent flows:", error)
        setError("An unexpected error occurred. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    // Only load flows if we're not on the login page
    if (window.location.pathname !== "/login") {
      loadFlows()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  const handleEditFlow = (id: string) => {
    router.push(`/dashboard/call-flows/editor?id=${id}`)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Call Flows</CardTitle>
          <CardDescription>Your recently created or updated call flows</CardDescription>
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4 flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-[200px] mb-2" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
              <Skeleton className="h-8 w-[80px]" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Call Flows</CardTitle>
          <CardDescription>Unable to load your call flows</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <p className="text-center text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  if (flows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Call Flows</CardTitle>
          <CardDescription>You haven't created any call flows yet</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <p className="text-center text-muted-foreground mb-4">
            Create your first call flow to start making automated calls
          </p>
          <Button onClick={() => router.push("/dashboard/call-flows/new")}>Create Call Flow</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Call Flows</CardTitle>
        <CardDescription>Your recently created or updated call flows</CardDescription>
      </CardHeader>
      <CardContent>
        {flows.map((flow) => (
          <div key={flow.id} className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium">{flow.name || "Untitled Flow"}</h4>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(flow.updated_at).toLocaleDateString()}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleEditFlow(flow.id)}>
              Edit
            </Button>
          </div>
        ))}
        <div className="mt-4 text-center">
          <Button variant="link" onClick={() => router.push("/dashboard/call-flows")}>
            View All Call Flows
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}