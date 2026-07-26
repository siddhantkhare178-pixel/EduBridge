import Groq from 'groq-sdk'

export interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  points: number
}

export interface GenerateQuizParams {
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: number
  questionType?: 'multiple-choice' | 'true-false' | 'mixed'
}

export class QuizGenerator {
  static async generateQuiz(params: GenerateQuizParams): Promise<QuizQuestion[]> {
    const { topic, difficulty, questionCount, questionType = 'multiple-choice' } = params

    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      console.warn('Groq API key not configured, using fallback questions')
      return this.getFallbackQuestions(topic, difficulty, questionCount)
    }

    const points = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15

    const prompt = `You are an expert quiz creator. Generate ${questionCount} ${difficulty} level multiple-choice questions about "${topic}".

IMPORTANT: Return ONLY a valid JSON object with no additional text, explanations, or formatting.

Requirements:
- Each question should be clear, educational, and relevant to ${topic}
- Provide exactly 4 options for each question
- Include brief explanations for correct answers
- Points: ${points} per question
- correctAnswer should be the index (0-3) of the correct option

Return this exact JSON structure:
{
  "questions": [
    {
      "question": "What is the main concept of ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 2,
      "explanation": "Brief explanation of why option C is correct",
      "points": ${points}
    }
  ]
}

Generate exactly ${questionCount} questions about ${topic} at ${difficulty} difficulty level.`

    try {
      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY!
      })

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert quiz creator. Always respond with valid JSON only, no additional text or formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama3-8b-8192",
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9
      })

      const text = completion.choices[0]?.message?.content?.trim()

      if (!text) {
        throw new Error('No response from Groq API')
      }



      // Try to extract JSON more robustly
      let jsonText = text

      // Remove markdown code blocks if present
      if (text.includes('```json')) {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/)
        if (match) jsonText = match[1]
      } else if (text.includes('```')) {
        const match = text.match(/```\s*([\s\S]*?)\s*```/)
        if (match) jsonText = match[1]
      }

      // Find JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid questions format')
      }

      // Validate and fix questions
      const validQuestions = parsed.questions
        .filter((q: any) =>
          q.question &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          typeof q.correctAnswer === 'number' &&
          q.correctAnswer >= 0 &&
          q.correctAnswer < 4
        )
        .map((q: any) => ({
          ...q,
          points: points // Ensure consistent points
        }))

      if (validQuestions.length === 0) {
        throw new Error('No valid questions generated')
      }

      return validQuestions.slice(0, questionCount) // Ensure exact count
    } catch (error) {
      console.error('Quiz generation error:', error)
      return this.getFallbackQuestions(topic, difficulty, questionCount)
    }
  }

  private static getFallbackQuestions(topic: string, difficulty: string, count: number): QuizQuestion[] {
    const points = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15

    const questionTemplates = [
      {
        question: `What is a fundamental concept in ${topic}?`,
        options: [
          `Basic principle of ${topic}`,
          `Advanced technique in ${topic}`,
          `Unrelated concept`,
          `Complex theory`
        ],
        correctAnswer: 0,
        explanation: `The basic principle is fundamental to understanding ${topic}.`
      },
      {
        question: `Which of the following is most important when learning ${topic}?`,
        options: [
          `Memorizing all details`,
          `Understanding core concepts`,
          `Skipping practice`,
          `Avoiding examples`
        ],
        correctAnswer: 1,
        explanation: `Understanding core concepts is crucial for mastering ${topic}.`
      },
      {
        question: `What is a common application of ${topic}?`,
        options: [
          `Theoretical research only`,
          `Practical problem solving`,
          `Historical documentation`,
          `Abstract mathematics`
        ],
        correctAnswer: 1,
        explanation: `${topic} is commonly used for practical problem solving.`
      },
      {
        question: `When studying ${topic}, what should you focus on first?`,
        options: [
          `Advanced techniques`,
          `Basic foundations`,
          `Complex examples`,
          `Expert-level concepts`
        ],
        correctAnswer: 1,
        explanation: `Starting with basic foundations provides a solid base for learning ${topic}.`
      },
      {
        question: `What makes ${topic} valuable to learn?`,
        options: [
          `It's trendy`,
          `It solves real problems`,
          `It's easy`,
          `It's complicated`
        ],
        correctAnswer: 1,
        explanation: `${topic} is valuable because it helps solve real-world problems.`
      }
    ]

    return Array.from({ length: count }, (_, i) => {
      const template = questionTemplates[i % questionTemplates.length]
      return {
        ...template,
        points
      }
    })
  }

  static async generateQuizFromContent(content: string, questionCount: number = 5): Promise<QuizQuestion[]> {
    const prompt = `Based on the following content, generate ${questionCount} multiple-choice questions to test understanding:

Content:
${content.substring(0, 2000)}...

Requirements:
- Questions should test key concepts from the content
- Provide 4 options each
- Include explanations
- Assign 10 points per question
- Return valid JSON format

Format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation",
      "points": 10
    }
  ]
}`

    try {
      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY!
      })

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert quiz creator. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama3-8b-8192",
        temperature: 0.7,
        max_tokens: 2048
      })

      const text = completion.choices[0]?.message?.content?.trim()

      if (!text) {
        throw new Error('No response from Groq API')
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      return parsed.questions || []
    } catch (error) {
      console.error('Content-based quiz generation error:', error)
      return this.getFallbackQuestions('lesson content', 'medium', questionCount)
    }
  }
}