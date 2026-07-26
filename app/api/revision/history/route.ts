import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const courseId = searchParams.get("courseId")

    const where = {
      userId: session.user.id,
      ...(courseId && { courseId })
    }

    const [sessions, streak, stats] = await Promise.all([
      // Get recent sessions
      prisma.revisionSession.findMany({
        where,
        select: {
          id: true,
          topic: true,
          explanation: true,
          score: true,
          feedback: true,
          duration: true,
          method: true,
          createdAt: true,
          course: {
            select: {
              title: true,
              createdBy: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: limit
      }),
      
      // Get streak info
      prisma.revisionStreak.findUnique({
        where: { userId: session.user.id }
      }),
      
      // Get stats
      prisma.revisionSession.aggregate({
        where: { userId: session.user.id },
        _avg: { score: true },
        _count: { id: true },
        _sum: { duration: true }
      })
    ])

    // Get weekly progress
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const weeklyProgress = await prisma.revisionSession.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: weekAgo }
      },
      select: {
        score: true,
        createdAt: true
      },
      orderBy: { createdAt: "asc" }
    })

    return NextResponse.json({
      sessions,
      streak: {
        current: streak?.currentStreak || 0,
        longest: streak?.longestStreak || 0,
        lastRevision: streak?.lastRevisionDate
      },
      stats: {
        totalSessions: stats._count.id,
        averageScore: Math.round(stats._avg.score || 0),
        totalTimeSpent: stats._sum.duration || 0
      },
      weeklyProgress
    })
  } catch (error) {
    console.error("Error fetching revision history:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}