import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string

    // Get enrollment stats
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            lessons: {
              include: {
                progress: {
                  where: { userId }
                }
              }
            }
          }
        }
      }
    })

    const enrolledCourses = enrollments.length
    let completedCourses = 0
    let totalProgress = 0

    enrollments.forEach(enrollment => {
      const lessons = enrollment.course.lessons
      if (lessons.length === 0) return

      const completedLessons = lessons.filter(lesson => 
        lesson.progress.some(p => p.percent === 100)
      ).length

      const courseProgress = (completedLessons / lessons.length) * 100
      totalProgress += courseProgress

      if (courseProgress === 100) {
        completedCourses++
      }
    })

    const averageProgress = enrolledCourses > 0 ? totalProgress / enrolledCourses : 0

    return NextResponse.json({
      enrolledCourses,
      completedCourses,
      averageProgress: Math.round(averageProgress)
    })
  } catch (error) {
    console.error("User stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}