
'use client'

import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { ScrollArea } from '../ui/scroll-area'
import { toast } from '../ui/use-toast'
import { convertReactFlowToBland, type ReactFlowData } from '../../services/reactflow-converter'
import { Loader2, Send, Eye } from 'lucide-react'

interface UpdatePathwayModalProps {
  reactFlowData: ReactFlowData
}

export function UpdatePathwayModal({ reactFlowData }: UpdatePathwayModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  // Form fields
  const [apiKey, setApiKey] = useState('')
  const [pathwayId, setPathwayId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const convertedData = convertReactFlowToBland(reactFlowData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "API key is required",
        variant: "destructive",
      })
      return
    }

    if (!pathwayId.trim()) {
      toast({
        title: "Error",
        description: "Pathway ID is required",
        variant: "destructive",
      })
      return
    }

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Pathway name is required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/bland-ai/update-pathway-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          pathwayId: pathwayId.trim(),
          name: name.trim(),
          description: description.trim(),
          nodes: convertedData.nodes,
          edges: convertedData.edges,
        }),
      })

      const result = await response.json()

      if (result.status === 'success') {
        toast({
          title: "Success!",
          description: "Pathway updated successfully on Bland.ai",
        })
        
        // Reset form and close modal
        setApiKey('')
        setPathwayId('')
        setName('')
        setDescription('')
        setIsOpen(false)
        setShowPreview(false)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update pathway",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating pathway:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const finalPayload = {
    name: name.trim(),
    description: description.trim() || `Updated on ${new Date().toISOString()}`,
    nodes: convertedData.nodes,
    edges: convertedData.edges,
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          size="sm"
        >
          🚀 Update
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Update Pathway on Bland.ai</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!showPreview ? (
            // Form View
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Authorization (API Key) *</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">Your Bland.ai API key</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pathwayId">Pathway ID *</Label>
                  <Input
                    id="pathwayId"
                    placeholder="pathway-123..."
                    value={pathwayId}
                    onChange={(e) => setPathwayId(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">The unique identifier of the pathway to update</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Pathway Name *</Label>
                <Input
                  id="name"
                  placeholder="My Pathway"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">The name of your conversational pathway</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A description of the pathway..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500">Optional description of your pathway</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Converted Data Summary:</h4>
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Original Nodes:</strong> {reactFlowData.nodes.length}</p>
                    <p><strong>Cleaned Nodes:</strong> {convertedData.nodes.length}</p>
                  </div>
                  <div>
                    <p><strong>Original Edges:</strong> {reactFlowData.edges.length}</p>
                    <p><strong>Cleaned Edges:</strong> {convertedData.edges.length}</p>
                  </div>
                </div>
                <p className="text-green-600 text-xs mt-2">✅ UI-specific properties will be removed before sending</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview Payload
                </Button>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isLoading ? 'Updating...' : 'Send to Bland.ai'}
                </Button>
              </div>
            </form>
          ) : (
            // Preview View
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Final Payload Preview</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  size="sm"
                >
                  ← Back to Form
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>API Key:</strong> {apiKey ? '••••••••' + apiKey.slice(-4) : 'Not set'}</div>
                  <div><strong>Pathway ID:</strong> {pathwayId || 'Not set'}</div>
                  <div><strong>Name:</strong> {name || 'Not set'}</div>
                  <div><strong>Description:</strong> {description || 'Auto-generated'}</div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">JSON Payload:</h4>
                  <ScrollArea className="h-96 w-full rounded-md border p-4">
                    <pre className="text-xs">
                      {JSON.stringify(finalPayload, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !apiKey || !pathwayId || !name}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Updating Pathway...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Confirm & Send to Bland.ai
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
