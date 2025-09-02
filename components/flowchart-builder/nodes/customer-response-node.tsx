'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { MessageSquare, Edit3, Trash2, Copy } from 'lucide-react'

interface CustomerResponseNodeData {
  text: string
  options?: string[]
  responses?: string[]
  variableName?: string
  intentDescription?: string
}

export function CustomerResponseNode({ data, selected, onEdit, onDelete, onDuplicate }: { 
  data: any; 
  selected?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}) {
  return (
    <div className="relative">
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
      
      {/* Action Icons */}
      {selected && (
        <div className="absolute -right-12 top-0 flex flex-col gap-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.();
            }}
            className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}