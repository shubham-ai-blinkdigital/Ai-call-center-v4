'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PhoneForwarded } from 'lucide-react'

interface TransferNodeData {
  text: string
  transferNumber?: string
}

export function TransferNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-purple-100 border-2 min-w-[200px] cursor-pointer transition-all duration-200 ${
      selected ? 'border-purple-500 shadow-lg scale-105' : 'border-purple-300 hover:border-purple-400'
    }`}>
      <div className="flex items-center space-x-2">
        <PhoneForwarded className="w-4 h-4 text-purple-600" />
        <div className="font-bold text-purple-800">
          {data.name || 'Transfer Call'}
        </div>
      </div>
      <div className="text-sm text-purple-700 mt-1">
        {data.transferNumber || '+1234567890'}
      </div>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}