import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CourseOverviewClient } from "./CourseOverviewClient"

export default async function Page() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Get user's enrolled courses with progress data
  const enrollments = await prisma.enrollment.findMany({
    where: { 
      userId: session.user.id,
      status: "active"
    },
    include: {
      course: {
        include: {
          _count: { select: { lessons: true } },
          createdBy: { select: { name: true } },
          lessons: {
            select: { id: true },
            orderBy: { order: "asc" }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  // If user has only one course, redirect directly to it
  if (enrollments.length === 1) {
    redirect(`/course-player/${enrollments[0].courseId}`)
  }

  // Get progress for all enrolled courses
  const allLessonIds = enrollments.flatMap(e => e.course.lessons.map(l => l.id))
  const progressData = await prisma.progress.findMany({
    where: {
      userId: session.user.id,
      lessonId: { in: allLessonIds }
    }
  })

  // Calculate progress for each course and serialize data for client
  const coursesWithProgress = enrollments.map(enrollment => {
    const courseProgress = progressData.filter(p => 
      enrollment.course.lessons.some(l => l.id === p.lessonId)
    )
    const completedLessons = courseProgress.filter(p => p.percent >= 100).length
    const totalLessons = enrollment.course._count.lessons
    const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return {
      ...enrollment,
      course: {
        ...enrollment.course,
        // Convert Decimal to string for client serialization
        price: enrollment.course.price.toString(),
        // Ensure dates are serializable
        createdAt: enrollment.course.createdAt.toISOString(),
        updatedAt: enrollment.course.updatedAt.toISOString()
      },
      // Ensure enrollment dates are serializable
      createdAt: enrollment.createdAt.toISOString(),
      updatedAt: enrollment.updatedAt.toISOString(),
      progress: {
        completed: completedLessons,
        total: totalLessons,
        percentage: overallProgress
      }
    }
  })

  return <CourseOverviewClient courses={coursesWithProgress} />
}


