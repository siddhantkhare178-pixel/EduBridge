import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Verify quiz exists and is public
    const quiz = await prisma.customQuiz.findUnique({
      where: { id }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    if (!quiz.isPublic && quiz.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get best attempts for each user (highest score, then fastest time)
    const leaderboard = await prisma.quizAttempt.findMany({
      where: {
        quizId: id,
        completed: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { timeSpent: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // Get unique users with their best attempts
    const userBestAttempts = new Map()
    
    leaderboard.forEach(attempt => {
      const userId = attempt.userId
      const existing = userBestAttempts.get(userId)
      
      if (!existing || 
          attempt.score > existing.score || 
          (attempt.score === existing.score && attempt.timeSpent < existing.timeSpent)) {
        userBestAttempts.set(userId, attempt)
      }
    })

    // Convert to array and sort again
    const finalLeaderboard = Array.from(userBestAttempts.values())
      .sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score
        if (a.timeSpent !== b.timeSpent) return a.timeSpent - b.timeSpent
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })
      .slice(0, 20) // Top 20

    return NextResponse.json(finalLeaderboard)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}