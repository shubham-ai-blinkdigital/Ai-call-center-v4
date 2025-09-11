
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { callIngestionService } from '@/services/call-ingestion-service'

// Auto-start ingestion service when module loads (server startup)
console.log('🔍 [INGESTION] Checking auto-start conditions...', {
  NODE_ENV: process.env.NODE_ENV,
  AUTO_START_INGESTION: process.env.AUTO_START_INGESTION
})

if (process.env.NODE_ENV === 'production' || process.env.AUTO_START_INGESTION === 'true' || process.env.NODE_ENV === 'development') {
  console.log('🚀 [INGESTION] Auto-starting ingestion service...')
  setTimeout(() => {
    try {
      callIngestionService.startIngestion()
      console.log('✅ [INGESTION] Auto-start completed successfully')
    } catch (error) {
      console.error('❌ [INGESTION] Auto-start failed:', error)
    }
  }, 3000) // Wait 3 seconds for app to initialize
}

export async function GET() {
  try {
    // Check health status
    const status = callIngestionService.getHealthStatus()
    return NextResponse.json({ 
      status: 'success',
      ingestion: status
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to get ingestion status',
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow admin users to control ingestion
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action } = await request.json()

    switch (action) {
      case 'start':
        callIngestionService.startIngestion()
        return NextResponse.json({ 
          message: 'Ingestion service started',
          status: callIngestionService.getHealthStatus()
        })

      case 'stop':
        callIngestionService.stopIngestion()
        return NextResponse.json({ 
          message: 'Ingestion service stopped',
          status: callIngestionService.getHealthStatus()
        })

      case 'trigger':
        await callIngestionService.triggerIngestion()
        return NextResponse.json({ 
          message: 'Manual ingestion triggered',
          status: callIngestionService.getHealthStatus()
        })

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use: start, stop, or trigger' 
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('🚨 [INGESTION-API] Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
