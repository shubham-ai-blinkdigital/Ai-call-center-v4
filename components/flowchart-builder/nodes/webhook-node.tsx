
'use client'

import React from 'react'
import { Handle, Position } from 'reactflow'
import { Globe, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WebhookNodeProps {
  data: {
    name?: string
    text?: string
    url?: string
    method?: string
    body?: string
    extractVars?: any[]
    responseData?: any[]
    headers?: any[]
    authorization?: string
    timeout?: number
    retryAttempts?: number
    rerouteServer?: boolean
  }
  selected?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function WebhookNode({ data, selected, onEdit, onDelete }: WebhookNodeProps) {
  return (
    <div className={`
      relative bg-white border-2 rounded-lg shadow-lg min-w-[200px] max-w-[250px]
      ${selected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-orange-300'}
      hover:shadow-xl transition-all duration-200
    `}>
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-orange-500 bg-white"
      />

      {/* Header */}
      <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-t-md border-b border-orange-200">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4" />
          <span className="font-medium text-sm">Webhook</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-2">
          <div className="font-medium text-gray-900 text-sm">
            {data.name || 'Webhook Request'}
          </div>
          
          {data.method && data.url && (
            <div className="text-xs text-gray-600">
              <span className="font-mono bg-orange-50 px-1 py-0.5 rounded">
                {data.method}
              </span>{' '}
              <span className="truncate block mt-1">{data.url}</span>
            </div>
          )}

          {data.text && (
            <div className="text-sm text-gray-700 line-clamp-2">
              {data.text}
            </div>
          )}

          {data.extractVars && data.extractVars.length > 0 && (
            <div className="text-xs text-orange-600">
              Extracts {data.extractVars.length} variable{data.extractVars.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="h-6 w-6 p-0 bg-white shadow-sm hover:bg-orange-50"
        >
          <Edit className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="h-6 w-6 p-0 bg-white shadow-sm hover:bg-red-50 text-red-500"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-orange-500 bg-white"
      />
    </div>
  )
}
