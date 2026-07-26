import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const DASHBOARD_STATS_KEY = (userId: string) => `dashboard:stats:${userId}:v1`

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const cacheKey = DASHBOARD_STATS_KEY(session.user.id)
    const cached = await redis.get(cacheKey)
    if (cached) return NextResponse.json(cached)

    // Get user's enrollments with course and progress data
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          include: {
            lessons: {
              select: { id: true }
            },
            _count: {
              select: { lessons: true }
            }
          }
        }
      }
    })

    // Calculate progress for each course
    const courseProgressPromises = enrollments.map(async (enrollment) => {
      const courseId = enrollment.courseId
      const totalLessons = enrollment.course._count.lessons

      if (totalLessons === 0) {
        return {
          courseId,
          title: enrollment.course.title,
          progress: 0,
          completedLessons: 0,
          totalLessons: 0
        }
      }

      // Get user's progress for this course
      const progresses = await prisma.progress.findMany({
        where: {
          userId: session.user.id,
          lesson: {
            courseId: courseId
          }
        }
      })

      const completedLessons = progresses.filter(p => p.percent === 100).length
      const progress = Math.round((completedLessons / totalLessons) * 100)

      return {
        courseId,
        title: enrollment.course.title,
        progress,
        completedLessons,
        totalLessons
      }
    })

    const courseProgresses = await Promise.all(courseProgressPromises)

    // Calculate overall stats
    const activeCourses = enrollments.length
    const completedCourses = courseProgresses.filter(cp => cp.progress === 100).length
    const totalProgress = courseProgresses.reduce((sum, cp) => sum + cp.progress, 0)
    const avgProgress = activeCourses > 0 ? Math.round(totalProgress / activeCourses) : 0
    const totalLessonsCompleted = courseProgresses.reduce((sum, cp) => sum + cp.completedLessons, 0)

    // Calculate total learning time from progress records
    const totalTimeSpent = await prisma.progress.aggregate({
      where: { userId: session.user.id },
      _sum: { timeSpent: true }
    })

    const totalLearningHours = Math.round((totalTimeSpent._sum.timeSpent || 0) / 3600 * 100) / 100

    const stats = {
      activeCourses,
      completedCourses,
      avgProgress,
      totalLessonsCompleted,
      totalLearningHours,
      courseProgresses
    }

    await redis.set(cacheKey, stats, { ex: 300 }) // Cache for 5 minutes
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}