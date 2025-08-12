'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { MessageSquare } from 'lucide-react'

interface CustomerResponseNodeData {
  text: string
  options?: string[]
  responses?: string[]
  variableName?: string
  intentDescription?: string
}

export function CustomerResponseNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-yellow-100 border-2 min-w-[200px] cursor-pointer transition-all duration-200 ${
      selected ? 'border-yellow-500 shadow-lg scale-105' : 'border-yellow-300 hover:border-yellow-400'
    }`}>
      <div className="flex items-center space-x-2">
        <MessageSquare className="w-4 h-4 text-yellow-600" />
        <div className="font-bold text-yellow-800">
          {data.name || 'Customer Response'}
        </div>
      </div>
      <div className="text-sm text-yellow-700 mt-1">
        {data.text || 'Handle customer input'}
      </div>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
      />
    </div>
  )
}