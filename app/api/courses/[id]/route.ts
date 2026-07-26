import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const courseUpdateInput = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  price: z.coerce.number().nonnegative().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cacheKey = `course:${id}:v1`
    const cached = await redis.get(cacheKey)
    if (cached) return NextResponse.json(cached)

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: { 
          select: { 
            lessons: true, 
            enrollments: true 
          } 
        },
        createdBy: { 
          select: { 
            id: true, 
            name: true, 
            image: true 
          } 
        },
        lessons: {
          orderBy: { order: "asc" }
        }
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    await redis.set(cacheKey, course, { ex: 300 }) // Cache for 5 minutes
    return NextResponse.json(course)
  } catch (e) {
    console.error("Error fetching course:", e)
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Check if user owns the course
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      select: { createdById: true, status: true }
    })

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (existingCourse.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const updateData = courseUpdateInput.parse(body)
    
    const course = await prisma.course.update({
      where: { id },
      data: updateData,
    })

    // Clear cache
    await redis.del(`course:${id}:v1`)
    const userCacheKey = `courses:list:v2:${session.user.id}`
    await redis.del(userCacheKey)
    // Clear public cache if status was changed to/from published
    if (updateData.status === "published" || existingCourse.status === "published") {
      await redis.del("courses:public:v1")
    }
    
    return NextResponse.json(course)
  } catch (e) {
    console.error("Error updating course:", e)
    if (e instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: e.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Check if user owns the course
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      select: { createdById: true, status: true }
    })

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (existingCourse.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.course.delete({
      where: { id },
    })

    // Clear cache
    await redis.del(`course:${id}:v1`)
    const userCacheKey = `courses:list:v2:${session.user.id}`
    await redis.del(userCacheKey)
    // Clear public cache if the deleted course was published
    if (existingCourse.status === "published") {
      await redis.del("courses:public:v1")
    }
    
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Error deleting course:", e)
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
  }
}