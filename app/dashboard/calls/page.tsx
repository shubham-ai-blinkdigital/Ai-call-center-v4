
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone, Clock, DollarSign, RefreshCcw, Download, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CallStats {
  totalCalls: number
  completedCalls: number
  failedCalls: number
  totalDuration: number
  totalCost: number
}

interface DatabaseCall {
  id: string
  call_id: string
  to_number: string
  from_number: string
  duration_seconds: number
  status: string
  recording_url?: string
  transcript?: string
  summary?: string
  cost_cents?: number
  pathway_id?: string
  ended_reason?: string
  start_time?: string
  end_time?: string
  created_at: string
  updated_at: string
  phone_number_detail?: string
}

interface CallsData {
  calls: DatabaseCall[]
  total: number
}

export default function CallsPage() {
  const { user } = useAuth()
  const [callStats, setCallStats] = useState<CallStats | null>(null)
  const [callsData, setCallsData] = useState<CallsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [timeframe, setTimeframe] = useState("7d")
  const [page, setPage] = useState(1)
  const [limit] = useState(50)

  const fetchCallStats = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch call statistics
      const statsResponse = await fetch(`/api/calls/stats?userId=${user.id}&timeframe=${timeframe}`)
      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setCallStats(stats)
      }

      // Fetch calls from database
      const callsResponse = await fetch(`/api/calls/database?userId=${user.id}&limit=${limit}&offset=${(page - 1) * limit}`)
      if (callsResponse.ok) {
        const calls = await callsResponse.json()
        setCallsData(calls)
      }

    } catch (error) {
      console.error('Error fetching call data:', error)
      toast.error('Failed to fetch call data')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!user) return

    try {
      setSyncing(true)
      toast.info('Syncing calls from Bland.ai...')

      const response = await fetch('/api/calls/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
  }, [user, timeframe, page])

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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Call Database</h1>
          <p className="text-muted-foreground">
            View and manage your synced call data from the database
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {callStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{callStats.totalCalls}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Phone className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{callStats.completedCalls}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{callStats.failedCalls}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(callStats.totalDuration)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCost(callStats.totalCost)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Calls (Database)</CardTitle>
          <CardDescription>
            Call data synced from Bland.ai and stored in your database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {callsData && callsData.calls.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>To Number</TableHead>
                    <TableHead>From Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callsData.calls.map((call) => (
                    <TableRow key={call.call_id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(call.start_time || call.created_at)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {call.to_number || 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {call.from_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(call.status || 'unknown')}
                      </TableCell>
                      <TableCell>
                        {formatDuration(call.duration_seconds || 0)}
                      </TableCell>
                      <TableCell>
                        {formatCost(call.cost_cents || 0)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {call.ended_reason || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No calls found in database. Try clicking "Sync Now" to fetch data from Bland.ai, 
                or visit the Call History page to trigger automatic sync.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {callsData && callsData.total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, callsData.total)} of {callsData.total} calls
          </p>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= callsData.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
