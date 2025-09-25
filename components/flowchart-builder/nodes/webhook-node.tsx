
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
      group relative bg-white border-2 rounded-lg shadow-lg w-[250px] h-[120px] overflow-hidden
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
      <div className="bg-orange-100 text-orange-800 px-3 py-2 border-b border-orange-200">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4" />
          <span className="font-medium text-sm truncate">Webhook</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex-1">
        <div className="h-full flex flex-col">
          <div className="font-medium text-gray-900 text-sm truncate" title={data.name || 'Webhook Request'}>
            {data.name || 'Webhook Request'}
          </div>
          
          {data.method && data.url && (
            <div className="text-xs text-gray-600 mt-1">
              <span className="font-mono bg-orange-50 px-1 py-0.5 rounded text-xs">
                {data.method}
              </span>
            </div>
          )}

          <div className="text-sm text-gray-700 mt-1 overflow-hidden leading-tight" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} title={data.text}>
            {data.text || (data.url ? `URL: ${data.url}` : 'Configure webhook')}
          </div>
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
        <button
          onClick={onDelete}
          className="h-7 w-7 p-1.5 bg-red-500 rounded-full shadow-lg border border-red-600 hover:bg-red-600 hover:scale-110 transition-all duration-200 z-30"
        >
          <Trash2 className="w-3 h-3 text-white" />
        </button>
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
