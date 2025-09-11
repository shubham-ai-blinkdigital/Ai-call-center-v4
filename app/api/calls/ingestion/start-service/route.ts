
import { NextResponse } from 'next/server'
import { callIngestionService } from '@/services/call-ingestion-service'

export async function POST() {
  try {
    console.log('🚀 [INGESTION-START] Manual start requested')
    
    // Start the ingestion service
    callIngestionService.startIngestion()
    
    const status = callIngestionService.getHealthStatus()
    
    return NextResponse.json({
      success: true,
      message: 'Ingestion service started successfully',
      status
    })
    
  } catch (error: any) {
    console.error('❌ [INGESTION-START] Error starting service:', error)
    return NextResponse.json({ 
      error: 'Failed to start ingestion service',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const status = callIngestionService.getHealthStatus()
    
    return NextResponse.json({
      success: true,
      status
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to get ingestion status',
      details: error.message 
    }, { status: 500 })
  }
}
