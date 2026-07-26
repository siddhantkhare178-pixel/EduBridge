import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QuizGenerator } from '@/lib/quiz-generator'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, topic, difficulty, questionCount, isPublic } = await request.json()

    if (!title || !topic) {
      return NextResponse.json(
        { error: 'Title and topic are required' },
        { status: 400 }
      )
    }

    // Generate questions using AI
    const questions = await QuizGenerator.generateQuiz({
      topic,
      difficulty,
      questionCount,
      questionType: 'multiple-choice'
    })

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate questions' },
        { status: 500 }
      )
    }

    // Create quiz in database
    const quiz = await prisma.customQuiz.create({
      data: {
        title,
        description: description || null,
        topic,
        difficulty,
        isPublic: isPublic || false,
        createdById: session.user.id,
        questions: {
          create: questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: q.points
          }))
        }
      },
      include: {
        questions: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      quizId: quiz.id,
      quiz 
    })
  } catch (error) {
    console.error('Error generating quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}