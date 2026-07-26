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
      where: { createdById: session.user.id },
      include: {
        questions: true,
        createdBy: {
          select: { name: true, image: true }
        },
        _count: {
          select: { attempts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Error fetching user quizzes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}