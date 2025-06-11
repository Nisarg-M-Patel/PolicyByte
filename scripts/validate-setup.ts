// scripts/validate-setup.ts
import { LegiScanAPI } from '../src/lib/legiscan'
import { config } from 'dotenv'
import { join } from 'path'
import OpenAI from 'openai'

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') })

async function validateSetup() {
  console.log('Validating PolicyByte setup...\n')

  console.log('Environment Variables:')
  const requiredVars = ['DATABASE_URL', 'LEGISCAN_API_KEY', 'OPENAI_API_KEY']
  let envValid = true

  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (value) {
      console.log(`${varName}: Set`)
    } else {
      console.log(`${varName}: Missing`)
      envValid = false
    }
  }

  if (!envValid) {
    console.log('\nEnvironment setup incomplete. Check your .env.local file.')
    process.exit(1)
  }

  if (!process.env.LEGISCAN_API_KEY) {
    console.log('\nLEGISCAN_API_KEY missing')
    return
  }

  console.log('\nTesting LegiScan API...')
  try {
    const api = new LegiScanAPI(process.env.LEGISCAN_API_KEY)
    const sessions = await api.getSessionList('CA')
    console.log(`LegiScan API working. Found ${sessions.length} CA sessions`)
    
    if (sessions.length > 0) {
      console.log(`Latest session: ${sessions[0].session_name}`)
    }
  } catch (error) {
    console.log(`LegiScan API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return
  }

  console.log('\nTesting OpenAI API...')
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "API working"' }],
      max_tokens: 10
    })

    if (response.choices[0]?.message?.content) {
      console.log('OpenAI API working')
    }
  } catch (error) {
    console.log(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return
  }

  console.log('\nSetup validation complete. PolicyByte installation is ready.')
  console.log('\nNext steps:')
  console.log('1. Run: npm run dev')
  console.log('2. Visit: http://localhost:3000/admin')
  console.log('3. Start scraping California')
  console.log('4. Check the results on your map')
}

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error)
  process.exit(1)
})

validateSetup().catch((error) => {
  console.error('Setup validation failed:', error)
  process.exit(1)
})