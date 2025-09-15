import type { Node, Edge } from 'reactflow'

export interface BlandNode {
  id: string
  type: string
  data: any
  position?: { x: number; y: number }
}

export interface BlandEdge {
  id: string
  source: string
  target: string
  type?: string
  data?: any
  label?: string; // Added top-level label property
}

export interface BlandFlowData {
  nodes: BlandNode[]
  edges: BlandEdge[]
}

export interface ReactFlowData {
  nodes: Node[]
  edges: Edge[]
}

/**
 * Converts ReactFlow JSON data to clean Bland.ai compatible format
 * Removes UI-specific properties like position, selected, width, height, etc.
 */
export function convertReactFlowToBland(reactFlowData: ReactFlowData): BlandFlowData {
  console.log('🔄 Converting ReactFlow data to Bland.ai format...')

  // Clean nodes - remove UI-specific properties but keep position for proper rendering
  const cleanNodes: BlandNode[] = reactFlowData.nodes.map(node => ({
    id: node.id,
    type: node.type || 'Default',
    data: node.data,
    position: node.position || { x: 0, y: 0 }
  }))

  // Clean edges - remove UI-specific properties, use default type, and Bland.ai edge ID format
  const cleanEdges: BlandEdge[] = reactFlowData.edges.map(edge => ({
    id: `reactflow__edge-${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    type: "default",
    label: edge.data?.label || 'next',
    ...(edge.data && {
      data: {
        ...(edge.data.description && { description: edge.data.description }),
        isHighlighted: false
      }
    })
  }))

  const result = {
    nodes: cleanNodes,
    edges: cleanEdges
  }

  console.log('✅ Conversion complete:', {
    originalNodes: reactFlowData.nodes.length,
    cleanNodes: cleanNodes.length,
    originalEdges: reactFlowData.edges.length,
    cleanEdges: cleanEdges.length
  })

  return result
}

/**
 * Converts clean Bland.ai format back to ReactFlow format
 * Adds default UI properties for ReactFlow rendering
 */
export function convertBlandToReactFlow(blandData: BlandFlowData): ReactFlowData {
  console.log('🔄 Converting Bland.ai data to ReactFlow format...')

  // Add UI properties to nodes, preserve positions if available
  const reactFlowNodes: Node[] = blandData.nodes.map((node, index) => ({
    id: node.id,
    type: node.type,
    position: node.position || { x: 250 + (index * 50), y: index * 100 }, // Use existing position or default
    data: node.data,
    selected: false
  }))

  // Add UI properties to edges, use default type for proper rendering
  const reactFlowEdges: Edge[] = blandData.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type === 'custom' ? 'custom' : 'default', // Support both custom and default edge types
    animated: true,
    data: edge.data || { label: 'next' },
    style: { stroke: '#3b82f6', strokeWidth: 2 }
  }))

  const result = {
    nodes: reactFlowNodes,
    edges: reactFlowEdges
  }

  console.log('✅ Conversion complete:', {
    blandNodes: blandData.nodes.length,
    reactFlowNodes: reactFlowNodes.length,
    blandEdges: blandData.edges.length,
    reactFlowEdges: reactFlowEdges.length
  })

  return result
}

/**
 * Utility function to validate ReactFlow data structure
 */
export function validateReactFlowData(data: any): data is ReactFlowData {
  return (
    data &&
    Array.isArray(data.nodes) &&
    Array.isArray(data.edges) &&
    data.nodes.every((node: any) => node.id && node.type && node.data) &&
    data.edges.every((edge: any) => edge.id && edge.source && edge.target)
  )
}

/**
 * Utility function to validate Bland.ai data structure
 */
export function validateBlandData(data: any): data is BlandFlowData {
  return (
    data &&
    Array.isArray(data.nodes) &&
    Array.isArray(data.edges) &&
    data.nodes.every((node: any) => node.id && node.type && node.data) &&
    data.edges.every((edge: any) => edge.id && edge.source && edge.target)
  )
}