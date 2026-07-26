import { NextRequest, NextResponse } from 'next/server'

// Groq API configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface TutorRequest {
  messages: Message[]
  mode: string
}

export async function POST(request: NextRequest) {
  try {
    const { messages, mode }: TutorRequest = await request.json()

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured. Please add GROQ_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // Create system prompt based on tutoring mode
    const systemPrompt = getSystemPrompt(mode)

    // Prepare messages for Groq API
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10) // Keep last 10 messages for context
    ]

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`)
    }

    const data = await response.json()
    const aiMessage = data.choices[0]?.message?.content

    if (!aiMessage) {
      throw new Error('No response from Groq AI')
    }

    return NextResponse.json({ message: aiMessage })

  } catch (error) {
    console.error('AI Tutor API error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}

function getSystemPrompt(mode: string): string {
  const basePrompt = `You are an expert AI tutor designed to help students learn effectively. You should be encouraging, patient, and provide clear explanations. Always aim to help students understand concepts rather than just giving answers.`

  switch (mode) {
    case 'general':
      return `${basePrompt} You're in General Q&A mode. Answer any questions students have with detailed, easy-to-understand explanations. Break down complex topics into simpler parts and use examples when helpful.`
    
    case 'concept':
      return `${basePrompt} You're in Concept Deep Dive mode. When students ask about a topic, provide comprehensive explanations that build understanding step by step. Start with fundamentals and gradually introduce more complex aspects. Use analogies and real-world examples to make concepts clear.`
    
    case 'practice':
      return `${basePrompt} You're in Practice Problems mode. Help students solve problems by guiding them through the thinking process rather than giving direct answers. Ask leading questions, provide hints, and help them discover solutions themselves. Celebrate their progress and provide constructive feedback.`
    
    case 'debate':
      return `${basePrompt} You're in Debate Mode. Present multiple perspectives on topics and encourage critical thinking. Help students explore different viewpoints, analyze arguments, and develop their own informed opinions. Ask thought-provoking questions and challenge assumptions constructively.`
    
    default:
      return basePrompt
  }
}