
'use client'

import React, { useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { ScrollArea } from '../ui/scroll-area'
import { toast } from 'sonner'
import { convertReactFlowToBland } from '../../services/reactflow-converter'
import { useRouter, usePathname } from 'next/navigation'

interface ReactFlowData {
  nodes: any[]
  edges: any[]
}

interface SavePathwayModalProps {
  reactFlowData: ReactFlowData
  pathwayId?: string // Optional for backwards compatibility
}

export function SavePathwayModal({ reactFlowData, pathwayId }: SavePathwayModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // Extract phone number from URL
  const getPhoneNumberFromPath = () => {
    const pathParts = pathname.split('/')
    const phoneNumberIndex = pathParts.findIndex(part => part === 'pathway') + 1
    return pathParts[phoneNumberIndex] || null
  }

  const phoneNumber = getPhoneNumberFromPath()
  const convertedData = convertReactFlowToBland(reactFlowData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Pathway name is required")
      return
    }

    if (!pathwayId && !phoneNumber) {
      toast.error("Phone number not found. Please navigate from a phone number pathway page.")
      return
    }

    if (reactFlowData.nodes.length === 0) {
      toast.error("Cannot save empty flowchart. Please add some nodes first.")
      return
    }

    setIsLoading(true)

    try {
      // Choose endpoint based on whether we have a pathwayId
      const endpoint = pathwayId ? '/api/pathways/save-flowchart' : '/api/pathways/create'
      
      const payload = pathwayId 
        ? {
            pathwayId,
            name: name.trim(),
            flowchartData: convertedData,
          }
        : {
            name: name.trim(),
            description: description.trim() || null,
            phoneNumber: phoneNumber,
            flowchartData: convertedData,
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save pathway')
      }

      toast.success(pathwayId ? "Pathway updated successfully!" : "Pathway saved successfully!")
      
      // Reset form
      setName('')
      setDescription('')
      setIsOpen(false)
      
      // Optionally refresh the page to show updated data
      router.refresh()

    } catch (error) {
      console.error('Error saving pathway:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save pathway')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setShowPreview(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          size="sm"
        >
          <Save className="h-4 w-4 mr-1" />
          Save Pathway
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {pathwayId ? 'Update Pathway' : `Save Pathway for ${phoneNumber ? `+${phoneNumber}` : 'Phone Number'}`}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pathway Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Customer Support Flow"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">Give your pathway a descriptive name</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this pathway does..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">Optional description of your pathway's purpose</p>
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={phoneNumber ? `+${phoneNumber}` : 'Not detected'}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">This pathway will be associated with this phone number</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Flowchart Data Preview</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>

            {showPreview && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <p><strong>Nodes:</strong> {reactFlowData.nodes.length}</p>
                  <p><strong>Edges:</strong> {reactFlowData.edges.length}</p>
                </div>
                <ScrollArea className="h-48 w-full rounded-md border p-4">
                  <pre className="text-xs">
                    {JSON.stringify(convertedData, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !name.trim() || (!pathwayId && !phoneNumber)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {pathwayId ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {pathwayId ? 'Update Pathway' : 'Save Pathway'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
