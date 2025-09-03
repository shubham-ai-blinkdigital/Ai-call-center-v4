'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { MessageCircle, Pencil, Trash2 } from 'lucide-react'

interface GreetingNodeData {
  text: string
}

export function GreetingNode({ data, selected, onEdit, onDelete }: { data: any; selected?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this node?')) {
      onDelete?.()
    }
  }

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-green-100 border-2 min-w-[200px] transition-all duration-200 relative group ${
      selected ? 'border-green-500 shadow-lg scale-105' : 'border-green-300 hover:border-green-400'
    }`}>
      {/* Pencil Icon - appears on hover */}
      <button
        onClick={handleEdit}
        className="absolute -top-1 -right-1 p-1 bg-white rounded-full shadow-md border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50 z-10"
      >
        <Pencil className="w-3 h-3 text-gray-600" />
      </button>
      
      {/* Delete Icon - appears on hover */}
      <button
        onClick={handleDelete}
        className="absolute -top-1 -right-8 p-1 bg-red-500 rounded-full shadow-md border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 z-10"
      >
        <Trash2 className="w-3 h-3 text-white" />
      </button>
      
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