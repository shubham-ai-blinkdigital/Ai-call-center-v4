'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { MessageSquare, Pencil, Trash2 } from 'lucide-react'

interface CustomerResponseNodeData {
  name: string
  text: string
}

export function CustomerResponseNode({ data, selected, onEdit, onDelete }: { data: any; selected?: boolean; onEdit?: () => void; onDelete?: () => void }) {
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
    <div className={`px-4 py-2 shadow-md rounded-md bg-yellow-100 border-2 min-w-[200px] transition-all duration-200 relative group ${
      selected ? 'border-yellow-500 shadow-lg scale-105' : 'border-yellow-300 hover:border-yellow-400'
    }`}>
      {/* Pencil Icon - appears on hover */}
      <button
        onClick={handleEdit}
        className="absolute -top-1 -right-1 p-1 bg-white rounded-full shadow-md border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50 z-10"
      >
        <Pencil className="w-3 h-3 text-gray-600" />
      </button>

      {/* Trash Icon - appears on hover */}
      <button
        onClick={handleDelete}
        className="absolute -top-1 -right-9 p-1 bg-white rounded-full shadow-md border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50 z-10"
      >
        <Trash2 className="w-3 h-3 text-red-600" />
      </button>

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