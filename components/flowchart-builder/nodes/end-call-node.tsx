'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PhoneOff } from 'lucide-react'

interface EndCallNodeData {
  text: string
}

export function EndCallNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-red-100 border-2 min-w-[200px] cursor-pointer transition-all duration-200 ${
      selected ? 'border-red-500 shadow-lg scale-105' : 'border-red-300 hover:border-red-400'
    }`}>
      <div className="flex items-center space-x-2">
        <PhoneOff className="w-4 h-4 text-red-600" />
        <div className="font-bold text-red-800">
          {data.name || 'End Call'}
        </div>
      </div>
      <div className="text-sm text-red-700 mt-1">
        {data.prompt || data.text || 'End conversation'}
      </div>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
    </div>
  )
}