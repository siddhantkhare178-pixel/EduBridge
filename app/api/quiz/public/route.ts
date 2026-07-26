import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quizzes = await prisma.customQuiz.findMany({
      where: { 
        isPublic: true
        // Include all public quizzes, including user's own
      },
      include: {
        questions: true,
        createdBy: {
          select: { name: true, image: true }
        },
        _count: {
          select: { attempts: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 most recent public quizzes
    })

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Error fetching public quizzes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}