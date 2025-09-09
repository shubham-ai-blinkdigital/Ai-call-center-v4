
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Phone, Clock, DollarSign, Activity, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface CallStats {
  total_calls: number
  completed_calls: number
  failed_calls: number
  avg_duration: number
  total_duration: number
  total_cost_cents: number
  first_call: string
  last_call: string
}

interface Call {
  id: string
  call_id: string
  to_number: string
  from_number: string
  duration_seconds: number
  status: string
  created_at: string
  cost_cents: number
  phone_detail: string
}

export default function CallsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<CallStats | null>(null)
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [timeframe, setTimeframe] = useState('7d')

  const fetchCallStats = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/calls/stats?userId=${user.id}&timeframe=${timeframe}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.data.summary)
        setCalls(data.data.recentCalls)
      }
    } catch (error) {
      console.error('Error fetching call stats:', error)
      toast.error('Failed to fetch call statistics')
    } finally {
      setLoading(false)
    }
  }

  const syncCalls = async () => {
    if (!user) return

    setSyncing(true)
    try {
      const response = await fetch('/api/calls/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        fetchCallStats() // Refresh data
      } else {
        toast.error(data.message || 'Failed to sync calls')
      }
    } catch (error) {
      console.error('Error syncing calls:', error)
      toast.error('Failed to sync calls')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchCallStats()
  }, [user, timeframe])

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatCost = (cents: number) => {
    if (!cents) return '$0.00'
    return `$${(cents / 100).toFixed(2)}`
  }

  const getStatusBadge = (status: string) => {
    const variant = status === 'completed' ? 'default' : 
                   status === 'failed' ? 'destructive' : 'secondary'
    return <Badge variant={variant}>{status}</Badge>
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call Analytics</h1>
          <p className="text-muted-foreground">
            Monitor and analyze your call data from Bland AI
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          
          <Button onClick={syncCalls} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Calls'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_calls}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completed_calls} completed, {stats.failed_calls} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(stats.total_duration)}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatDuration(Math.round(stats.avg_duration))}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCost(stats.total_cost_cents)}
              </div>
              <p className="text-xs text-muted-foreground">
                Call costs from Bland AI
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_calls > 0 
                  ? Math.round((stats.completed_calls / stats.total_calls) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Call completion rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Calls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
          <CardDescription>
            Latest calls from your phone numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call ID</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="font-mono text-sm">
                    {call.call_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{call.from_number}</TableCell>
                  <TableCell>{call.to_number}</TableCell>
                  <TableCell>{formatDuration(call.duration_seconds)}</TableCell>
                  <TableCell>{getStatusBadge(call.status)}</TableCell>
                  <TableCell>{formatCost(call.cost_cents)}</TableCell>
                  <TableCell>
                    {new Date(call.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {calls.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No calls found. Try syncing your calls or check your timeframe.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
