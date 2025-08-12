'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { MessageCircle } from 'lucide-react'

interface GreetingNodeData {
  text: string
}

export function GreetingNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-green-100 border-2 min-w-[200px] cursor-pointer transition-all duration-200 ${
      selected ? 'border-green-500 shadow-lg scale-105' : 'border-green-300 hover:border-green-400'
    }`}>
      <div className="flex items-center space-x-2">
        <MessageCircle className="w-4 h-4 text-green-600" />
        <div className="font-bold text-green-800">
          {data.name || 'Greeting'}
        </div>
      </div>
      <div className="text-sm text-green-700 mt-1">
        {data.text || 'Welcome message'}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}