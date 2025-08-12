
export interface ApiNode {
  id: string
  type: string
  data: any
}

export interface ApiEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface ApiResponse {
  nodes: ApiNode[]
  edges: ApiEdge[]
  name?: string
  description?: string
}

export interface FlowchartData {
  nodes: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    data: any
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    type?: string
    animated?: boolean
    data?: { label: string }
    style?: any
  }>
}

export function convertApiResponseToFlowchart(apiResponse: ApiResponse): FlowchartData {
  console.log('🔄 Converting API response to flowchart format...')
  
  // Convert nodes with positioning
  const nodes = apiResponse.nodes.map((node, index) => ({
    id: node.id,
    type: node.type,
    position: { 
      x: 250 + (index % 3) * 300, 
      y: 100 + Math.floor(index / 3) * 150 
    },
    data: node.data
  }))

  // Convert edges with styling
  const edges = apiResponse.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'custom',
    animated: true,
    data: { label: edge.label || 'next' },
    style: { stroke: '#3b82f6', strokeWidth: 2 }
  }))

  const result = {
    nodes,
    edges
  }

  console.log('✅ Conversion complete:', {
    apiNodes: apiResponse.nodes.length,
    flowchartNodes: nodes.length,
    apiEdges: apiResponse.edges.length,
    flowchartEdges: edges.length
  })

  return result
}
