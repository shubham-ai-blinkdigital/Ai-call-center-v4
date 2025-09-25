'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PhoneOff, Pencil, Trash2 } from 'lucide-react'

interface EndCallNodeData {
  prompt: string
}

export function EndCallNode({ data, selected, onEdit, onDelete }: { data: any; selected?: boolean; onEdit?: () => void; onDelete?: () => void }) {
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
    <div className={`px-4 py-3 shadow-md rounded-md bg-red-100 border-2 w-[250px] h-[120px] transition-all duration-200 relative group overflow-hidden ${
      selected ? 'border-red-500 shadow-lg scale-105' : 'border-red-300 hover:border-red-400'
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
        className="absolute -top-2 -right-8 p-1.5 bg-red-500 rounded-full shadow-lg border border-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110 z-30"
      >
        <Trash2 className="w-3 h-3 text-white" />
      </button>

      <div className="flex items-center space-x-2">
        <PhoneOff className="w-4 h-4 text-red-600" />
        <div className="font-bold text-red-800">
          {data.name || 'End Call'}
        </div>
      </div>
      <div className="text-sm text-red-700 mt-2 leading-tight overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }} title={data.prompt || data.text || 'End conversation'}>
        {data.prompt || data.text || 'End conversation'}
      </div>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
    </div>
  )
}