// src/lib/ai.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface BillSummary {
  brief: string
  keyPoints: string[]
  impact: string
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confidence: number
}

function cleanJsonResponse(content: string): string {
  let cleanedContent = content.trim()
  if (cleanedContent.startsWith('```json')) {
    cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (cleanedContent.startsWith('```')) {
    cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }
  return cleanedContent
}

export async function summarizeBill(
  title: string,
  fullText: string,
  state: string
): Promise<BillSummary> {
  const startTime = Date.now()
  console.log(`Summarizing bill: ${title} (${fullText.length} characters)`)
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1000,
      }
    })

    const prompt = `You are an expert policy analyst. Analyze this ${state} state legislation and provide a comprehensive summary.

BILL TITLE: ${title}

BILL TEXT:
${fullText}

Please provide a JSON response with the following structure:
{
  "brief": "A concise 2-3 sentence summary for general public consumption",
  "keyPoints": ["3-5 bullet points covering the main provisions"],
  "impact": "Who this affects and how (citizens, businesses, environment, etc.)",
  "category": "One of: Education, Healthcare, Environment, Economy, Transportation, Criminal Justice, Technology, Housing, Agriculture, Other",
  "priority": "LOW, MEDIUM, HIGH, or CRITICAL based on scope of impact",
  "confidence": 0.85
}

Focus on:
- Clear, accessible language for non-experts
- Practical implications for residents
- Key stakeholders affected
- Timeline if mentioned
- Funding/budget implications if any

Avoid political bias and stick to factual analysis.`
    
    const result = await model.generateContent(prompt)
    const content = result.response.text()
    
    if (!content) {
      throw new Error('No response from Gemini')
    }

    const cleanedContent = cleanJsonResponse(content)
    const summary = JSON.parse(cleanedContent) as BillSummary
    
    // Validate the response structure
    if (!summary.brief || !summary.keyPoints || !summary.impact) {
      throw new Error('Invalid summary structure from Gemini')
    }

    const elapsed = Date.now() - startTime
    console.log(`✓ Gemini summary completed in ${elapsed}ms`)
    
    return summary
    
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error(`✗ Gemini summary failed after ${elapsed}ms:`, error)
    
    // Fallback summary
    return {
      brief: `This ${state} bill titled "${title}" requires detailed analysis. The full text has been preserved for manual review.`,
      keyPoints: ['Full bill text available for detailed review', 'Manual analysis required'],
      impact: 'Impact analysis pending - please review full text',
      category: 'Other',
      priority: 'MEDIUM',
      confidence: 0.1
    }
  }
}

export async function categorizeBills(bills: Array<{ title: string; summary?: string }>) {
  const prompt = `Analyze these bills and categorize them by topic. Return a JSON object where keys are categories and values are arrays of bill indices.

Bills:
${bills.map((bill, i) => `${i}: ${bill.title} - ${bill.summary || 'No summary'}`).join('\n')}

Categories to use: Education, Healthcare, Environment, Economy, Transportation, Criminal Justice, Technology, Housing, Agriculture, Other

Example response:
{
  "Education": [0, 3],
  "Healthcare": [1],
  "Environment": [2, 4]
}
`

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
      }
    })

    const result = await model.generateContent(prompt)
    const content = result.response.text()
    
    if (!content) {
      return {}
    }

    return JSON.parse(cleanJsonResponse(content))
  } catch (error) {
    console.error('Error categorizing bills:', error)
    return {}
  }
}

export async function extractKeyTerms(text: string): Promise<string[]> {
  const prompt = `Extract 5-10 key terms from this legislative text that would be useful for search and categorization.
Focus on:
- Policy areas (education, healthcare, etc.)
- Specific programs or entities mentioned
- Important legal or regulatory concepts
- Funding mechanisms
- Target populations

Text: ${text.slice(0, 2000)}...

Return as a JSON array of strings.`

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 200,
      }
    })

    const result = await model.generateContent(prompt)
    const content = result.response.text()
    
    if (!content) {
      return []
    }

    return JSON.parse(cleanJsonResponse(content))
  } catch (error) {
    console.error('Error extracting key terms:', error)
    return []
  }
}