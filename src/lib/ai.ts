import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface BillSummary {
  brief: string
  keyPoints: string[]
  impact: string
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confidence: number
}

export async function summarizeBill(
  title: string,
  fullText: string,
  state: string
): Promise<BillSummary> {
  const prompt = `
You are an expert policy analyst. Analyze this ${state} state legislation and provide a comprehensive summary.

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
  "confidence": 0.85 // Your confidence in the analysis (0-1)
}

Focus on:
- Clear, accessible language for non-experts
- Practical implications for residents
- Key stakeholders affected
- Timeline if mentioned
- Funding/budget implications if any

Avoid political bias and stick to factual analysis.
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful policy analyst who creates clear, unbiased summaries of legislation. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const summary = JSON.parse(content) as BillSummary
    
    // Validate the response structure
    if (!summary.brief || !summary.keyPoints || !summary.impact) {
      throw new Error('Invalid summary structure from AI')
    }

    return summary
  } catch (error) {
    console.error('Error summarizing bill:', error)
    
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
  const prompt = `
Analyze these bills and categorize them by topic. Return a JSON object where keys are categories and values are arrays of bill indices.

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
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You categorize legislation by topic. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return {}
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('Error categorizing bills:', error)
    return {}
  }
}

export async function extractKeyTerms(text: string): Promise<string[]> {
  const prompt = `
Extract 5-10 key terms from this legislative text that would be useful for search and categorization.
Focus on:
- Policy areas (education, healthcare, etc.)
- Specific programs or entities mentioned
- Important legal or regulatory concepts
- Funding mechanisms
- Target populations

Text: ${text.slice(0, 2000)}...

Return as a JSON array of strings.
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract key terms from legislative text. Respond with a JSON array of strings.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 200
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return []
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('Error extracting key terms:', error)
    return []
  }
}