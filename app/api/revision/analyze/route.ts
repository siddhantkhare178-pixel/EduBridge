import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { topic, explanation } = await request.json()

    if (!topic || !explanation) {
      return NextResponse.json(
        { error: "Topic and explanation are required" },
        { status: 400 }
      )
    }

    // Simulate AI analysis - In production, integrate with OpenAI or similar
    const feedback = await analyzeExplanation(topic, explanation)

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error("Error analyzing revision:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function analyzeExplanation(topic: string, explanation: string) {
  try {
    // Use Groq API for real AI analysis
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // Fast and efficient model
        messages: [
          {
            role: "system",
            content: `You are an educational AI tutor that analyzes student explanations and provides constructive feedback. 
            
            Your task is to evaluate how well a student understands a topic based on their explanation. 
            
            Respond ONLY with valid JSON in this exact format:
            {
              "overallScore": <number 0-100>,
              "correctConcepts": ["concept1", "concept2"],
              "missingConcepts": ["missing1", "missing2"],
              "incorrectConcepts": ["wrong1", "wrong2"],
              "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
              "encouragement": "encouraging message"
            }
            
            Guidelines:
            - overallScore: 0-100 based on accuracy, completeness, and understanding depth
            - correctConcepts: Key concepts the student explained well (2-6 items)
            - missingConcepts: Important concepts not mentioned (2-5 items)
            - incorrectConcepts: Misconceptions or errors (0-3 items)
            - suggestions: Specific, actionable advice for improvement (2-4 items)
            - encouragement: Positive, motivating message based on their performance
            
            Be constructive, educational, and encouraging. Focus on learning growth.`
          },
          {
            role: "user",
            content: `Topic: "${topic}"
            
            Student's explanation:
            "${explanation}"
            
            Please analyze this explanation and provide educational feedback.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      console.error("Groq API error:", response.status, response.statusText)
      // Fallback to mock analysis if API fails
      return await mockAnalyzeExplanation(topic, explanation)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error("No content in Groq response")
      return await mockAnalyzeExplanation(topic, explanation)
    }

    try {
      // Parse the JSON response from Groq
      const feedback = JSON.parse(content)
      
      // Validate the response structure
      if (typeof feedback.overallScore !== 'number' || 
          !Array.isArray(feedback.correctConcepts) ||
          !Array.isArray(feedback.missingConcepts) ||
          !Array.isArray(feedback.incorrectConcepts) ||
          !Array.isArray(feedback.suggestions) ||
          typeof feedback.encouragement !== 'string') {
        throw new Error("Invalid response structure")
      }

      // Ensure score is within bounds
      feedback.overallScore = Math.max(0, Math.min(100, Math.round(feedback.overallScore)))
      
      return feedback
    } catch (parseError) {
      console.error("Error parsing Groq response:", parseError)
      console.error("Raw content:", content)
      return await mockAnalyzeExplanation(topic, explanation)
    }
  } catch (error) {
    console.error("Error calling Groq API:", error)
    // Fallback to mock analysis
    return await mockAnalyzeExplanation(topic, explanation)
  }
}

// Fallback mock analysis function
async function mockAnalyzeExplanation(topic: string, explanation: string) {
  const words = explanation.toLowerCase().split(/\s+/)
  const wordCount = words.length
  
  // Mock analysis based on content length and keywords
  const topicKeywords = getTopicKeywords(topic.toLowerCase())
  const mentionedKeywords = topicKeywords.filter(keyword => 
    explanation.toLowerCase().includes(keyword.toLowerCase())
  )
  
  const score = Math.min(95, Math.max(20, 
    (mentionedKeywords.length / topicKeywords.length) * 70 + 
    Math.min(wordCount / 50, 1) * 30
  ))

  const correctConcepts = mentionedKeywords.slice(0, Math.ceil(mentionedKeywords.length * 0.8))
  const missingConcepts = topicKeywords.filter(k => !mentionedKeywords.includes(k))
  const incorrectConcepts = wordCount < 30 ? ["Needs more detail"] : []

  return {
    overallScore: Math.round(score),
    correctConcepts: correctConcepts.length > 0 ? correctConcepts : ["Basic understanding demonstrated"],
    missingConcepts: missingConcepts.slice(0, 5),
    incorrectConcepts,
    suggestions: generateSuggestions(score, wordCount, mentionedKeywords.length),
    encouragement: generateEncouragement(score)
  }
}

function getTopicKeywords(topic: string): string[] {
  // Mock keyword mapping - in production, this would come from course content analysis
  const keywordMap: Record<string, string[]> = {
    "javascript": ["variables", "functions", "objects", "arrays", "loops", "conditionals", "promises", "async/await"],
    "react": ["components", "props", "state", "hooks", "jsx", "virtual dom", "lifecycle", "context"],
    "python": ["variables", "functions", "classes", "modules", "lists", "dictionaries", "loops", "exceptions"],
    "machine learning": ["algorithms", "training", "data", "models", "features", "supervised", "unsupervised", "neural networks"],
    "web development": ["html", "css", "javascript", "responsive", "frontend", "backend", "database", "api"],
    "data structures": ["arrays", "linked lists", "stacks", "queues", "trees", "graphs", "hash tables", "algorithms"]
  }
  
  // Find matching keywords or return generic ones
  for (const [key, keywords] of Object.entries(keywordMap)) {
    if (topic.includes(key)) {
      return keywords
    }
  }
  
  return ["concepts", "principles", "applications", "examples", "theory", "practice"]
}

function generateSuggestions(score: number, wordCount: number, keywordCount: number): string[] {
  const suggestions = []
  
  if (score < 50) {
    suggestions.push("Review the core concepts and try to explain them in your own words")
    suggestions.push("Practice with more examples to strengthen your understanding")
  }
  
  if (wordCount < 50) {
    suggestions.push("Try to provide more detailed explanations with specific examples")
  }
  
  if (keywordCount < 3) {
    suggestions.push("Include more technical terms and key concepts in your explanation")
  }
  
  if (score >= 70) {
    suggestions.push("Great job! Try explaining this concept to someone else to reinforce your learning")
    suggestions.push("Consider exploring advanced topics related to this subject")
  }
  
  suggestions.push("Review the course materials for any concepts you might have missed")
  
  return suggestions.slice(0, 4)
}

function generateEncouragement(score: number): string {
  if (score >= 90) {
    return "Excellent! You have a strong grasp of this topic. Your explanation shows deep understanding."
  } else if (score >= 70) {
    return "Great work! You understand the key concepts well. A few more details would make your explanation even stronger."
  } else if (score >= 50) {
    return "Good start! You're on the right track. Focus on the missing concepts to improve your understanding."
  } else {
    return "Keep learning! Everyone starts somewhere. Review the materials and try again - you've got this!"
  }
}