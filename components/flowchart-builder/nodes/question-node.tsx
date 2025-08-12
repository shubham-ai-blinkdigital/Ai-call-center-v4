'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { HelpCircle } from 'lucide-react'

interface QuestionNodeData {
  name: string
  text: string
}

export function QuestionNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 min-w-[200px] cursor-pointer transition-all duration-200 ${
      selected ? 'border-blue-500 shadow-lg scale-105' : 'border-blue-300 hover:border-blue-400'
    }`}>
      <div className="flex items-center space-x-2">
        <HelpCircle className="w-4 h-4 text-blue-600" />
        <div className="font-bold text-blue-800">
          {data.name || 'Question'}
        </div>
      </div>
      <div className="text-sm text-blue-700 mt-1">
        {data.text || 'Ask a question'}
      </div>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}