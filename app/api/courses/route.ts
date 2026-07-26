import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const COURSE_LIST_KEY = "courses:list:v2"

const courseInput = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.coerce.number().nonnegative(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const isTeacherRequest = searchParams.get("teacher") === "true"

    // Create a user-specific cache key
    const userCacheKey = `${COURSE_LIST_KEY}:${session.user.id}`
    const cached = await redis.get(userCacheKey)
    if (cached && !isTeacherRequest) return NextResponse.json(cached)

    // Only fetch courses created by the authenticated user
    const data = await prisma.course.findMany({
      where: { createdById: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { lessons: true, enrollments: true } },
        createdBy: { select: { id: true, name: true, image: true } },
        lessons: {
          select: { 
            id: true,
            progress: {
              select: { percent: true }
            }
          }
        },
        enrollments: {
          select: { userId: true }
        }
      },
    })

    // Calculate average progress for each course
    const coursesWithProgress = await Promise.all(data.map(async course => {
      let averageProgress = 0
      
      if (course.lessons.length > 0 && course.enrollments.length > 0) {
        // Get all progress records for this course
        const allProgress = await prisma.progress.findMany({
          where: {
            lessonId: { in: course.lessons.map(l => l.id) },
            userId: { in: course.enrollments.map(e => e.userId) }
          },
          select: {
            userId: true,
            lessonId: true,
            percent: true
          }
        })
        
        // Group progress by user
        const progressByUser = new Map<string, number[]>()
        
        course.enrollments.forEach(enrollment => {
          const userProgress = course.lessons.map(lesson => {
            const progress = allProgress.find(p => 
              p.userId === enrollment.userId && p.lessonId === lesson.id
            )
            return progress ? progress.percent : 0
          })
          
          progressByUser.set(enrollment.userId, userProgress)
        })
        
        // Calculate average progress across all students
        let totalProgressSum = 0
        let studentCount = 0
        
        progressByUser.forEach(userProgress => {
          const userAverage = userProgress.reduce((sum, percent) => sum + percent, 0) / userProgress.length
          totalProgressSum += userAverage
          studentCount++
        })
        
        averageProgress = studentCount > 0 ? Math.round(totalProgressSum / studentCount) : 0
      }
      
      // Remove the detailed progress data from the response
      const { lessons, enrollments, ...courseData } = course
      return {
        ...courseData,
        averageProgress,
        _count: course._count
      }
    }))

    // For teacher requests (like announcement dialog), return in expected format
    if (isTeacherRequest) {
      const courses = coursesWithProgress.map(course => ({
        id: course.id,
        title: course.title
      }))
      return NextResponse.json({ courses })
    }

    await redis.set(userCacheKey, coursesWithProgress, { ex: 60 })
    return NextResponse.json(coursesWithProgress)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { title, description, price, status } = courseInput.parse(body)
    const course = await prisma.course.create({
      data: { 
        title, 
        description, 
        price: price, // Prisma will handle the Decimal conversion
        status, 
        createdById: session.user.id 
      },
    })
    // Clear user-specific cache and public cache if published
    const userCacheKey = `${COURSE_LIST_KEY}:${session.user.id}`
    await redis.del(userCacheKey)
    if (status === "published") {
      await redis.del("courses:public:v1")
    }
    return NextResponse.json(course, { status: 201 })
  } catch (e) {
    console.error("Course creation error:", e)
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}
