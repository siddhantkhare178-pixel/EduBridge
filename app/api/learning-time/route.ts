import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const LEARNING_TIME_KEY = (userId: string) => `learning:time:${userId}:v1`

const sessionSchema = z.object({
  lessonId: z.string(),
  courseId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().min(0).optional(),
})

// Get learning time data for dashboard
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get("days") || "7")
  
  try {
    const cacheKey = LEARNING_TIME_KEY(session.user.id)
    const cached = await redis.get(cacheKey)
    if (cached) return NextResponse.json(cached)

    // Get learning sessions for the last N days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const sessions = await prisma.learningSession.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Group by day and calculate total hours
    const dailyData = new Map<string, number>()
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' })
      const dateKey = date.toISOString().split('T')[0]
      dailyData.set(dateKey, 0)
    }

    // Aggregate session durations by date
    sessions.forEach(session => {
      const dateKey = session.date.toISOString().split('T')[0]
      const currentHours = dailyData.get(dateKey) || 0
      dailyData.set(dateKey, currentHours + (session.duration / 3600)) // Convert seconds to hours
    })

    // Format for chart
    const chartData = Array.from(dailyData.entries()).map(([dateKey, hours]) => {
      const date = new Date(dateKey)
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        hours: Math.round(hours * 100) / 100, // Round to 2 decimal places
        date: dateKey
      }
    })

    const result = {
      dailyData: chartData,
      totalHours: chartData.reduce((sum, day) => sum + day.hours, 0),
      avgHoursPerDay: chartData.length > 0 ? chartData.reduce((sum, day) => sum + day.hours, 0) / chartData.length : 0
    }

    await redis.set(cacheKey, result, { ex: 300 }) // Cache for 5 minutes
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching learning time:", error)
    return NextResponse.json({ error: "Failed to fetch learning time" }, { status: 500 })
  }
}

// Start or update a learning session
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let requestData
  const contentType = req.headers.get('content-type')
  
  if (contentType?.includes('application/json')) {
    requestData = await req.json().catch(() => ({}))
  } else {
    // Handle FormData from sendBeacon
    const formData = await req.formData()
    requestData = {
      lessonId: formData.get('lessonId'),
      courseId: formData.get('courseId'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      duration: formData.get('duration') ? Number(formData.get('duration')) : undefined
    }
  }

  const parsed = sessionSchema.safeParse(requestData)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  const { lessonId, courseId, startTime, endTime, duration } = parsed.data

  try {
    // Verify lesson exists and user has access
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        courseId: courseId,
        course: {
          enrollments: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found or access denied" }, { status: 404 })
    }

    const sessionStart = new Date(startTime)
    const sessionDate = new Date(sessionStart)
    sessionDate.setHours(0, 0, 0, 0) // Start of day for aggregation

    let sessionDuration = duration || 0
    if (endTime && !duration) {
      const sessionEnd = new Date(endTime)
      sessionDuration = Math.max(0, (sessionEnd.getTime() - sessionStart.getTime()) / 1000)
    }

    // Create learning session record
    const learningSession = await prisma.learningSession.create({
      data: {
        userId: session.user.id,
        lessonId,
        courseId,
        startTime: sessionStart,
        endTime: endTime ? new Date(endTime) : null,
        duration: sessionDuration,
        date: sessionDate
      }
    })

    // Update progress with accumulated time
    if (sessionDuration > 0) {
      await prisma.progress.upsert({
        where: {
          userId_lessonId: {
            userId: session.user.id,
            lessonId
          }
        },
        update: {
          timeSpent: {
            increment: sessionDuration
          }
        },
        create: {
          userId: session.user.id,
          lessonId,
          timeSpent: sessionDuration,
          percent: 0
        }
      })
    }

    // Clear cache
    await redis.del(LEARNING_TIME_KEY(session.user.id))
    // Also clear dashboard stats cache
    await redis.del(`dashboard:stats:${session.user.id}:v1`)

    return NextResponse.json(learningSession)
  } catch (error) {
    console.error("Error creating learning session:", error)
    return NextResponse.json({ error: "Failed to create learning session" }, { status: 500 })
  }
}