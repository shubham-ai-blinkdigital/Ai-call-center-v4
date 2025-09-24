
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
  type?: string
  label?: string
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
  
  // Clean nodes - remove UI-specific properties and handle webhook nodes specially
  const cleanNodes: BlandNode[] = reactFlowData.nodes.map(node => {
    let cleanData = { ...node.data }
    
    // Special handling for webhook nodes - generate responsePathways from edges
    if (node.type === 'webhookNode') {
      const connectedEdges = reactFlowData.edges.filter(edge => edge.source === node.id)
      const responsePathways: any[] = []
      
      // Generate conditional pathways based on connected edges
      connectedEdges.forEach(edge => {
        const targetNode = reactFlowData.nodes.find(n => n.id === edge.target)
        if (targetNode && edge.data?.label) {
          // Create pathway based on edge label
          const [variable, operator, value] = edge.data.label.split(' ')
          if (variable && operator && value) {
            responsePathways.push([
              variable.trim(),
              operator.trim(),
              value.trim(),
              {
                id: targetNode.id,
                name: targetNode.data.name || 'Next Node'
              }
            ])
          }
        }
      })
      
      cleanData = {
        ...cleanData,
        responsePathways,
        // Remove UI-only fields that shouldn't go to Bland.ai
        authorization: undefined,
        timeout: undefined,
        retryAttempts: undefined,
        rerouteServer: undefined
      }
      
      // Ensure webhook-specific structure for Bland.ai
      if (node.type === 'webhookNode') {
        return {
          id: node.id,
          type: 'Webhook',
          data: cleanData
        }
      }
    }
    
    return {
      id: node.id,
      type: node.type || 'Default',
      data: cleanData
    }
  })

  // Clean edges - remove UI-specific properties and color, but keep type: "custom"
  const cleanEdges: BlandEdge[] = reactFlowData.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "custom",
    label: edge.data?.label || edge.label || 'next',
    ...(edge.data && { 
      data: {
        label: edge.data.label || edge.label || 'next',
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
    label: edge.label || edge.data?.label || 'next',
    data: edge.data || { label: edge.label || 'next' },
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
