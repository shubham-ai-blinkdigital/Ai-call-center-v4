
import { CallDatabaseService } from './call-database-service'
import { db } from '@/lib/db'

export class CallIngestionService {
  private static instance: CallIngestionService
  private ingestionTimer: NodeJS.Timeout | null = null
  private isIngesting = false
  private readonly INGESTION_INTERVAL = 30000 // 30 seconds for real-time feel
  private readonly BATCH_SIZE = 100

  private constructor() {}

  static getInstance(): CallIngestionService {
    if (!CallIngestionService.instance) {
      CallIngestionService.instance = new CallIngestionService()
    }
    return CallIngestionService.instance
  }

  /**
   * Start continuous ingestion for all users
   */
  startIngestion() {
    if (this.ingestionTimer) {
      console.log('🔄 [INGESTION] Already running')
      return
    }

    console.log('🚀 [INGESTION] Starting background ingestion service')
    this.ingestionTimer = setInterval(() => {
      this.ingestAllUserCalls().catch(error => {
        console.error('❌ [INGESTION] Error in scheduled ingestion:', error)
      })
    }, this.INGESTION_INTERVAL)

    // Run immediately on start
    this.ingestAllUserCalls().catch(error => {
      console.error('❌ [INGESTION] Error in initial ingestion:', error)
    })
  }

  /**
   * Stop continuous ingestion
   */
  stopIngestion() {
    if (this.ingestionTimer) {
      clearInterval(this.ingestionTimer)
      this.ingestionTimer = null
      console.log('⏹️ [INGESTION] Stopped background ingestion service')
    }
  }

  /**
   * Ingest calls for all users with phone numbers
   */
  private async ingestAllUserCalls(): Promise<void> {
    if (this.isIngesting) {
      console.log('⚠️ [INGESTION] Already ingesting, skipping')
      return
    }

    this.isIngesting = true
    console.log('🔄 [INGESTION] Starting ingestion cycle...')

    try {
      // Get all users with phone numbers
      const usersWithPhones = await db.query(`
        SELECT DISTINCT u.id, u.email, COUNT(pn.id) as phone_count
        FROM users u
        JOIN phone_numbers pn ON u.id = pn.user_id
        GROUP BY u.id, u.email
      `)

      console.log(`📊 [INGESTION] Found ${usersWithPhones.rows.length} users with phone numbers`)

      const results = {
        totalUsers: usersWithPhones.rows.length,
        totalSynced: 0,
        errors: [] as string[]
      }

      // Process each user
      for (const user of usersWithPhones.rows) {
        try {
          const syncResult = await this.ingestUserCalls(user.id)
          results.totalSynced += syncResult.synced
          if (syncResult.errors.length > 0) {
            results.errors.push(`User ${user.email}: ${syncResult.errors.join(', ')}`)
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          results.errors.push(`User ${user.email}: ${errorMsg}`)
          console.error(`❌ [INGESTION] Failed for user ${user.email}:`, error)
        }
      }

      console.log(`✅ [INGESTION] Cycle complete:`, {
        users: results.totalUsers,
        synced: results.totalSynced,
        errors: results.errors.length
      })

      // Update last ingestion timestamp
      await this.updateIngestionMetadata(results)

    } catch (error) {
      console.error('💥 [INGESTION] Critical error in ingestion cycle:', error)
    } finally {
      this.isIngesting = false
    }
  }

  /**
   * Ingest calls for a specific user using existing sync logic
   */
  private async ingestUserCalls(userId: string): Promise<{ synced: number, errors: string[] }> {
    try {
      // Get user's phone numbers
      const phoneNumbers = await db.query(
        'SELECT phone_number FROM phone_numbers WHERE user_id = $1',
        [userId]
      )

      if (phoneNumbers.rows.length === 0) {
        return { synced: 0, errors: ['No phone numbers found'] }
      }

      // Fetch calls from Bland.ai API for user's phone numbers
      const blandApiKey = process.env.BLAND_AI_API_KEY
      if (!blandApiKey) {
        throw new Error('Bland.ai API key not configured')
      }

      // Get calls from Bland.ai (last 1000 to catch recent ones)
      const response = await fetch(`https://api.bland.ai/v1/calls?limit=1000&ascending=false&sort_by=created_at`, {
        headers: {
          'Authorization': blandApiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Bland API error: ${response.status}`)
      }

      const data = await response.json()
      const allCalls = data.calls || []

      // Filter calls for user's phone numbers
      const userPhoneNumbers = phoneNumbers.rows.map(row => row.phone_number)
      const userCalls = allCalls.filter((call: any) => {
        const fromNumber = call.from || call.from_number || ''
        const toNumber = call.to || call.to_number || ''
        return userPhoneNumbers.some(phone => 
          phone === fromNumber || phone === toNumber
        )
      })

      // Sync to database using existing service
      const syncCount = await CallDatabaseService.syncCallsForUser(userId, userCalls)

      return { synced: syncCount, errors: [] }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      return { synced: 0, errors: [errorMsg] }
    }
  }

  /**
   * Update ingestion metadata for monitoring
   */
  private async updateIngestionMetadata(results: any): Promise<void> {
    try {
      const metadata = {
        last_ingestion: new Date().toISOString(),
        total_users: results.totalUsers,
        total_synced: results.totalSynced,
        error_count: results.errors.length,
        errors: results.errors.slice(0, 10) // Keep last 10 errors
      }

      // Store in a simple metadata table or log
      console.log('📊 [INGESTION] Metadata:', metadata)
    } catch (error) {
      console.error('⚠️ [INGESTION] Failed to update metadata:', error)
    }
  }

  /**
   * Manual trigger for immediate ingestion
   */
  async triggerIngestion(): Promise<void> {
    console.log('🔄 [INGESTION] Manual trigger initiated')
    await this.ingestAllUserCalls()
  }

  /**
   * Backfill calls for a date range
   */
  async backfillCalls(startDate: Date, endDate: Date): Promise<void> {
    console.log('🔄 [INGESTION] Starting backfill from', startDate, 'to', endDate)
    
    // Use the same logic but potentially with date filters if Bland.ai supports it
    // For now, we'll ingest all and let the database dedupe
    await this.ingestAllUserCalls()
  }

  /**
   * Health check for the ingestion service
   */
  getHealthStatus(): {
    isRunning: boolean
    isIngesting: boolean
    intervalMs: number
    lastIngestion?: Date
  } {
    return {
      isRunning: this.ingestionTimer !== null,
      isIngesting: this.isIngesting,
      intervalMs: this.INGESTION_INTERVAL,
      lastIngestion: new Date() // Could track this properly
    }
  }
}

// Export singleton instance
export const callIngestionService = CallIngestionService.getInstance()
