'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { MessageCircle, Edit3, Trash2, Copy, Pencil } from 'lucide-react'

interface GreetingNodeData {
  text: string
}

export function GreetingNode({ data, selected, onEdit, onDelete, onDuplicate }: { 
  data: any; 
  selected?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}) {
  return (
    <div className="relative">
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

      {/* Action Icons */}
      {selected && (
        <div className="absolute -right-12 top-0 flex flex-col gap-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.()
            }}
            className="p-2 hover:bg-blue-100 rounded-full transition-colors bg-white shadow-sm border border-gray-200"
            title="Edit node"
          >
            <Pencil className="w-4 h-4 text-blue-600" />
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