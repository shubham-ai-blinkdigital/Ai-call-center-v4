'use client'

import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'

// Import custom nodes
import { GreetingNode } from './nodes/greeting-node'
import { QuestionNode } from './nodes/question-node'
import { CustomerResponseNode } from './nodes/customer-response-node'
import { EndCallNode } from './nodes/end-call-node'
import { TransferNode } from './nodes/transfer-node'
import { NodeEditorDrawer } from './node-editor-drawer'
import { CustomEdge } from './edges/custom-edge'
import { EdgeEditorDrawer } from './edge-editor-drawer'

import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { ScrollArea } from '../ui/scroll-area'
import { toast } from 'sonner'
import { convertReactFlowToBland, convertBlandToReactFlow } from '../../services/reactflow-converter'
import { UpdatePathwayModal } from './update-pathway-modal'
import { SavePathwayModal } from './save-pathway-modal'

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

// Custom edge types
const edgeTypes = {
  custom: CustomEdge,
}

interface FlowchartCanvasProps {
  phoneNumber?: string | null
  pathwayInfo?: any
}

export function FlowchartCanvas({ phoneNumber, pathwayInfo }: FlowchartCanvasProps = {}) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)
  const [isEdgeEditorOpen, setIsEdgeEditorOpen] = useState(false)
  const [isJsonPreviewOpen, setIsJsonPreviewOpen] = useState(false)
  const [isConvertedJsonOpen, setIsConvertedJsonOpen] = useState(false)
  const [isLoadingFlowchart, setIsLoadingFlowchart] = useState(false)

  const onEditNode = useCallback((node: Node) => {
    setSelectedNode(node)
    setIsEditorOpen(true)
  }, [])

  const onDeleteNode = useCallback((nodeId: string) => {
    // Remove the node
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))

    // Remove all connected edges
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))

    // Close any open editors if this node was selected
    setSelectedNode((prevSelected) => 
      prevSelected?.id === nodeId ? null : prevSelected
    )
    if (selectedNode?.id === nodeId) {
      setIsEditorOpen(false)
    }
  }, [setNodes, setEdges, selectedNode])

  const nodeTypes = useMemo(() => ({
    greetingNode: (props: any) => <GreetingNode {...props} onEdit={() => onEditNode(props)} onDelete={() => onDeleteNode(props.id)} />,
    Default: (props: any) => <CustomerResponseNode {...props} onEdit={() => onEditNode(props)} onDelete={() => onDeleteNode(props.id)} />,
    questionNode: (props: any) => <QuestionNode {...props} onEdit={() => onEditNode(props)} onDelete={() => onDeleteNode(props.id)} />,
    customerResponseNode: (props: any) => <CustomerResponseNode {...props} onEdit={() => onEditNode(props)} onDelete={() => onDeleteNode(props.id)} />,
    endCallNode: (props: any) => <EndCallNode {...props} onEdit={() => onEditNode(props)} onDelete={() => onDeleteNode(props.id)} />,
    'End Call': (props: any) => <EndCallNode {...props} onEdit={() => onEditNode(props)} onDelete={() => onDeleteNode(props.id)} />,
    transferNode: (props: any) => <TransferNode {...props} onEdit={() => onEditNode(props)} onDelete={() => onDeleteNode(props.id)} />,
  }), [onEditNode, onDeleteNode])

  // Load saved flowchart data when component mounts
  useEffect(() => {
    const loadSavedFlowchart = async () => {
      if (!pathwayInfo?.pathway_id) return

      console.log('[FLOWCHART-CANVAS] Loading pathway:', pathwayInfo.pathway_id)
      setIsLoadingFlowchart(true)
      try {
        const response = await fetch(`/api/pathways/load-flowchart?pathwayId=${pathwayInfo.pathway_id}`, {
          credentials: 'include'
        })
        const result = await response.json()

        console.log('[FLOWCHART-CANVAS] Load response:', result)

        if (result.success && result.pathway && result.pathway.flowchart_data) {
          const flowchartData = result.pathway.flowchart_data

          // Convert Bland format back to ReactFlow format
          if (flowchartData.nodes && flowchartData.edges) {
            const reactFlowData = convertBlandToReactFlow(flowchartData)
            setNodes(reactFlowData.nodes)
            setEdges(reactFlowData.edges)

            toast.success(`Loaded saved pathway: ${result.pathway.name}`)
          } else {
            console.log('[FLOWCHART-CANVAS] No flowchart data found, starting with empty canvas')
          }
        } else {
          console.log('[FLOWCHART-CANVAS] No pathway data found or failed to load')
        }
      } catch (error) {
        console.error('[FLOWCHART-CANVAS] Error loading saved flowchart:', error)
        toast.error('Failed to load saved pathway')
      } finally {
        setIsLoadingFlowchart(false)
      }
    }

    loadSavedFlowchart()
  }, [pathwayInfo?.pathway_id, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `edge_${params.source}_${params.target}_${Date.now()}`,
        type: 'custom',
        animated: true,
        data: { label: 'next' },
        style: { stroke: '#3b82f6', strokeWidth: 2 },
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setIsEditorOpen(false)
    setSelectedEdge(null)
    setIsEdgeEditorOpen(false)
  }, [])

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation()
    setSelectedEdge(edge)
    setIsEdgeEditorOpen(true)
    setSelectedNode(null)
    setIsEditorOpen(false)
  }, [])

  const onUpdateNode = useCallback((nodeId: string, updates: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, ...updates }
          : node
      )
    )

    // Update selectedNode if it's the one being edited
    setSelectedNode((prevSelected) =>
      prevSelected?.id === nodeId
        ? { ...prevSelected, ...updates }
        : prevSelected
    )
  }, [setNodes])

  const onUpdateEdge = useCallback((edgeId: string, updates: any) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? { ...edge, ...updates }
          : edge
      )
    )

    // Update selectedEdge if it's the one being edited
    setSelectedEdge((prevSelected) =>
      prevSelected?.id === edgeId
        ? { ...prevSelected, ...updates }
        : prevSelected
    )
  }, [setEdges])

  const onDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId))
    setSelectedEdge(null)
    setIsEdgeEditorOpen(false)
  }, [setEdges])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowWrapper.current || !reactFlowInstance) return

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const type = event.dataTransfer.getData('application/reactflow')

      if (!type) return

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode: Node = {
        id: type === 'greetingNode' ? '1' : `${type}_${Date.now()}`,
        type: (type === 'greetingNode' || type === 'questionNode' || type === 'customerResponseNode') ? 'Default' : 
              type === 'endCallNode' ? 'End Call' : type,
        position,
        data: getDefaultNodeData(type),
        selected: false,
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes],
  )

  const getDefaultNodeData = (nodeType: string) => {
    switch (nodeType) {
      case 'greetingNode':
        return {
          name: 'Start',
          text: 'Hey there, how are you doing today?',
          isStart: true,
        }
      case 'questionNode':
        return {
          name: 'New Question',
          text: 'What would you like to know?',
        }
      case 'customerResponseNode':
        return {
          name: 'Customer Response',
          text: 'Waiting for customer response...',
        }
      case 'transferNode':
        return {
          name: 'Transfer Call',
          text: 'Transferring the call now. Please hold..',
          transferNumber: '+1234567890',
        }
      case 'endCallNode':
        return {
          name: 'End Call',
          prompt: 'Say goodbye to the user',
        }
      default:
        return { name: 'Unknown Node' }
    }
  }

  const handleJsonPreview = useCallback(() => {
    setIsJsonPreviewOpen(true)
  }, [])

  const handleConvertedJsonPreview = useCallback(() => {
    setIsConvertedJsonOpen(true)
  }, [])

  return (
    <>
      <div className="w-full h-full relative" ref={reactFlowWrapper}>
        {isLoadingFlowchart && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              <span className="text-sm text-gray-600">Loading saved pathway...</span>
            </div>
          </div>
        )}
        {/* Floating Buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <SavePathwayModal 
              reactFlowData={{ nodes, edges }}
              pathwayId={pathwayInfo?.pathway_id}
            />
        <UpdatePathwayModal reactFlowData={{ nodes, edges }} />
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onPaneClick={onPaneClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          className="bg-gray-50"
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>

      <NodeEditorDrawer
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        selectedNode={selectedNode}
        onUpdateNode={onUpdateNode}
      />

      <EdgeEditorDrawer
        isOpen={isEdgeEditorOpen}
        onClose={() => setIsEdgeEditorOpen(false)}
        selectedEdge={selectedEdge}
        onUpdateEdge={onUpdateEdge}
        onDeleteEdge={onDeleteEdge}
      />
    </>
  )
}