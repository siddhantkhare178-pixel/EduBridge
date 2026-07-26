import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GamificationService, POINTS } from '@/lib/gamification'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { score, totalPoints, answers, timeSpent } = await request.json()

    // Verify quiz exists
    const quiz = await prisma.customQuiz.findUnique({
      where: { id },
      include: { questions: true }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId: id,
        score,
        totalPoints,
        answers,
        timeSpent,
        completed: true
      }
    })

    // Award points for quiz completion
    let newAchievements: any[] = []
    let pointsEarned = 0
    
    try {
      await GamificationService.awardPoints(
        session.user.id,
        POINTS.QUIZ_COMPLETION + score,
        `Quiz completion: ${quiz.title}`
      )
      pointsEarned = POINTS.QUIZ_COMPLETION + score

      // Update streak
      await GamificationService.updateStreak(session.user.id)

      // Check for achievements
      const context = { score, totalPoints, quizId: id }
      newAchievements = await GamificationService.checkAndAwardAchievements(
        session.user.id,
        context
      )
    } catch (gamificationError) {
      console.error('Gamification error (non-blocking):', gamificationError)
      // Don't fail the quiz attempt if gamification fails
      pointsEarned = score // At least give the quiz score as points
    }
    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        score: attempt.score,
        totalPoints: attempt.totalPoints,
        timeSpent: attempt.timeSpent,
        createdAt: attempt.createdAt
      },
      pointsEarned,
      newAchievements
    })
  } catch (error) {
    console.error('Error saving quiz attempt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId: session.user.id,
        quizId: id
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json(attempts)
  } catch (error) {
    console.error('Error fetching quiz attempts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}