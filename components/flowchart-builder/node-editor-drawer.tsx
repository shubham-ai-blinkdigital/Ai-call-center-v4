'use client'

import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Send } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface NodeEditorDrawerProps {
  isOpen: boolean
  onClose: () => void
  selectedNode: any | null
  onUpdateNode: (nodeId: string, updates: any) => void
}

export function NodeEditorDrawer({ isOpen, onClose, selectedNode, onUpdateNode }: NodeEditorDrawerProps) {
  if (!selectedNode) return null

  const handleFieldChange = (field: string, value: any) => {
    const updates = {
      data: {
        ...selectedNode.data,
        [field]: value
      }
    }
    onUpdateNode(selectedNode.id, updates)
  }

  const handleExtractVarAdd = () => {
    const currentVars = selectedNode.data.extractVars || []
    const newVar = ['variable_name', 'string', 'Description of variable']
    handleFieldChange('extractVars', [...currentVars, newVar])
  }

  const handleExtractVarUpdate = (index: number, field: number, value: string) => {
    const currentVars = [...(selectedNode.data.extractVars || [])]
    currentVars[index][field] = value
    handleFieldChange('extractVars', currentVars)
  }

  const handleExtractVarRemove = (index: number) => {
    const currentVars = [...(selectedNode.data.extractVars || [])]
    currentVars.splice(index, 1)
    handleFieldChange('extractVars', currentVars)
  }

  const renderNodeFields = () => {
    const nodeType = selectedNode.type

    switch (nodeType) {
      case 'greetingNode':
      case 'Default':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Node Name</Label>
              <Input
                id="name"
                value={selectedNode.data.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Enter node name"
              />
            </div>

            <div>
              <Label htmlFor="text">Greeting Message</Label>
              <Textarea
                id="text"
                value={selectedNode.data.text || ''}
                onChange={(e) => handleFieldChange('text', e.target.value)}
                placeholder="Hey there, how are you doing today?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="globalPrompt">Global Prompt (Optional)</Label>
              <Textarea
                id="globalPrompt"
                value={selectedNode.data.globalPrompt || ''}
                onChange={(e) => handleFieldChange('globalPrompt', e.target.value)}
                placeholder="This is a phone call. Do not use exclamation marks..."
                rows={3}
              />
            </div>

            {renderExtractVars()}
          </div>
        )

      case 'questionNode':
      case 'customerResponseNode':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Node Name</Label>
              <Input
                id="name"
                value={selectedNode.data.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Enter node name"
              />
            </div>

            <div>
              <Label htmlFor="text">Message</Label>
              <Textarea
                id="text"
                value={selectedNode.data.text || ''}
                onChange={(e) => handleFieldChange('text', e.target.value)}
                placeholder="What would you like to know?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="globalPrompt">Global Prompt (Optional)</Label>
              <Textarea
                id="globalPrompt"
                value={selectedNode.data.globalPrompt || ''}
                onChange={(e) => handleFieldChange('globalPrompt', e.target.value)}
                placeholder="Additional context or instructions..."
                rows={2}
              />
            </div>

            {renderExtractVars()}
          </div>
        )

      case 'webhookNode':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Node Name</Label>
              <Input
                id="name"
                value={selectedNode.data.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Webhook Request"
              />
            </div>

            <div>
              <Label htmlFor="text">Display Message</Label>
              <Textarea
                id="text"
                value={selectedNode.data.text || ''}
                onChange={(e) => handleFieldChange('text', e.target.value)}
                placeholder="Please give me a moment as I check our system.."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="method">HTTP Method</Label>
              <Select
                value={selectedNode.data.method || 'POST'}
                onValueChange={(value) => handleFieldChange('method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="url">API URL</Label>
              <Input
                id="url"
                value={selectedNode.data.url || ''}
                onChange={(e) => handleFieldChange('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
              />
            </div>

            <div>
              <Label htmlFor="body">Request Body (JSON)</Label>
              <Textarea
                id="body"
                value={selectedNode.data.body || ''}
                onChange={(e) => handleFieldChange('body', e.target.value)}
                placeholder='{\n  "key": "{{variable}}"\n}'
                rows={4}
              />
            </div>

            {renderExtractVars()}
            {renderResponseData()}
            {renderWebhookSettings()}
          </div>
        )

      case 'transferNode':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Node Name</Label>
              <Input
                id="name"
                value={selectedNode.data.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Transferring the call"
              />
            </div>

            <div>
              <Label htmlFor="text">Transfer Message</Label>
              <Textarea
                id="text"
                value={selectedNode.data.text || ''}
                onChange={(e) => handleFieldChange('text', e.target.value)}
                placeholder="Transferring the call now. Please hold.."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="transferNumber">Transfer Number</Label>
              <Input
                id="transferNumber"
                type="tel"
                value={selectedNode.data.transferNumber || ''}
                onChange={(e) => handleFieldChange('transferNumber', e.target.value)}
                placeholder="+19547951234"
              />
            </div>
          </div>
        )

      case 'endCallNode':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Node Name</Label>
              <Input
                id="name"
                value={selectedNode.data.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="End call"
              />
            </div>

            <div>
              <Label htmlFor="prompt">Goodbye Message</Label>
              <Textarea
                id="prompt"
                value={selectedNode.data.prompt || selectedNode.data.text || ''}
                onChange={(e) => handleFieldChange('prompt', e.target.value)}
                placeholder="Say goodbye to the user"
                rows={2}
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="text-sm text-gray-500">
            No editor available for this node type: {nodeType}
          </div>
        )
    }
  }

  const handleResponseDataAdd = () => {
    const currentData = selectedNode.data.responseData || []
    const newData = { data: '$.result', name: 'response_value', context: 'Response data description' }
    handleFieldChange('responseData', [...currentData, newData])
  }

  const handleResponseDataUpdate = (index: number, field: string, value: string) => {
    const currentData = [...(selectedNode.data.responseData || [])]
    currentData[index][field] = value
    handleFieldChange('responseData', currentData)
  }

  const handleResponseDataRemove = (index: number) => {
    const currentData = [...(selectedNode.data.responseData || [])]
    currentData.splice(index, 1)
    handleFieldChange('responseData', currentData)
  }

  const renderResponseData = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Response Data</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={handleResponseDataAdd}
          className="h-8"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Data
        </Button>
      </div>

      {(selectedNode.data.responseData || []).map((responseData: any, index: number) => (
        <div key={index} className="p-3 border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">Data {index + 1}</Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleResponseDataRemove(index)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label className="text-xs">JSONPath</Label>
              <Input
                value={responseData.data || ''}
                onChange={(e) => handleResponseDataUpdate(index, 'data', e.target.value)}
                placeholder="$.result"
                className="h-8"
              />
            </div>

            <div>
              <Label className="text-xs">Variable Name</Label>
              <Input
                value={responseData.name || ''}
                onChange={(e) => handleResponseDataUpdate(index, 'name', e.target.value)}
                placeholder="response_value"
                className="h-8"
              />
            </div>

            <div>
              <Label className="text-xs">Context</Label>
              <Input
                value={responseData.context || ''}
                onChange={(e) => handleResponseDataUpdate(index, 'context', e.target.value)}
                placeholder="Description of the response data"
                className="h-8"
              />
            </div>
          </div>
        </div>
      ))}

      {(selectedNode.data.responseData || []).length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          No response data configured. Click "Add Data" to start capturing API responses.
        </div>
      )}
    </div>
  )

  const renderWebhookSettings = () => (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <Label className="text-sm font-medium">Advanced Settings</Label>
      
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Authorization</Label>
          <Input
            value={selectedNode.data.authorization || ''}
            onChange={(e) => handleFieldChange('authorization', e.target.value)}
            placeholder="Bearer token or API key"
            className="h-8"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Timeout (seconds)</Label>
            <Input
              type="number"
              value={selectedNode.data.timeout || 10}
              onChange={(e) => handleFieldChange('timeout', parseInt(e.target.value) || 10)}
              className="h-8"
            />
          </div>

          <div>
            <Label className="text-xs">Retry Attempts</Label>
            <Input
              type="number"
              value={selectedNode.data.retryAttempts || 0}
              onChange={(e) => handleFieldChange('retryAttempts', parseInt(e.target.value) || 0)}
              className="h-8"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={selectedNode.data.rerouteServer || false}
            onCheckedChange={(checked) => handleFieldChange('rerouteServer', checked)}
          />
          <Label className="text-xs">Reroute through server</Label>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full h-8"
          disabled={!selectedNode.data.url}
        >
          <Send className="w-3 h-3 mr-2" />
          Test API Request
        </Button>
      </div>
    </div>
  )

  const renderExtractVars = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Extract Variables</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExtractVarAdd}
          className="h-8"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Variable
        </Button>
      </div>

      {(selectedNode.data.extractVars || []).map((extractVar: any[], index: number) => (
        <div key={index} className="p-3 border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">Variable {index + 1}</Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleExtractVarRemove(index)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label className="text-xs">Variable Name</Label>
              <Input
                value={extractVar[0] || ''}
                onChange={(e) => handleExtractVarUpdate(index, 0, e.target.value)}
                placeholder="variable_name"
                className="h-8"
              />
            </div>

            <div>
              <Label className="text-xs">Type</Label>
              <Select
                value={extractVar[1] || 'string'}
                onValueChange={(value) => handleExtractVarUpdate(index, 1, value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="integer">Integer</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="array">Array</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Description</Label>
              <Input
                value={extractVar[2] || ''}
                onChange={(e) => handleExtractVarUpdate(index, 2, e.target.value)}
                placeholder="Description of what to extract"
                className="h-8"
              />
            </div>
          </div>
        </div>
      ))}

      {(selectedNode.data.extractVars || []).length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          No variables configured. Click "Add Variable" to start extracting data.
        </div>
      )}
    </div>
  )

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-96 sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Edit Node Properties</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{selectedNode.type}</Badge>
            <span className="text-sm text-gray-500">ID: {selectedNode.id}</span>
          </div>

          {renderNodeFields()}
        </div>
      </SheetContent>
    </Sheet>
  )
}