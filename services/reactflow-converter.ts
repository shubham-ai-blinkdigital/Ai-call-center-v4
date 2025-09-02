
import type { Node, Edge } from 'reactflow'

export interface BlandNode {
  id: string
  type: string
  data: any
}

export interface BlandEdge {
  id: string
  source: string
  target: string
  data?: any
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
  
  // Clean nodes - remove UI-specific properties
  const cleanNodes: BlandNode[] = reactFlowData.nodes.map(node => ({
    id: node.id,
    type: node.type || 'Default',
    data: node.data
  }))

  // Clean edges - remove UI-specific properties and color
  const cleanEdges: BlandEdge[] = reactFlowData.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(edge.data && { 
      data: {
        label: edge.data.label
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
  
  // Add UI properties to nodes
  const reactFlowNodes: Node[] = blandData.nodes.map((node, index) => ({
    id: node.id,
    type: node.type,
    position: { x: 250 + (index * 50), y: index * 100 }, // Default positioning
    data: node.data,
    selected: false
  }))

  // Add UI properties to edges
  const reactFlowEdges: Edge[] = blandData.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'custom',
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
