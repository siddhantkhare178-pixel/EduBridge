import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const lessonInput = z.object({
  courseId: z.string(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  contentTypes: z.array(z.string()).default([]),
  textContent: z.string().nullable().optional(),
  externalLinks: z.array(z.string()).default([]),
  videoType: z.enum(["upload", "youtube"]).nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  videoPublicId: z.string().nullable().optional(),
  youtubeUrl: z.string().nullable().optional(),
  order: z.number().int().positive(),
  // Keep old fields for backward compatibility
  type: z.enum(["video", "text", "link"]).optional(),
  content: z.string().nullable().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { 
      courseId, 
      title, 
      description, 
      contentTypes, 
      textContent, 
      externalLinks, 
      videoType,
      videoUrl,
      videoPublicId,
      youtubeUrl, 
      order,
      // Backward compatibility
      type,
      content
    } = lessonInput.parse(body)

    // Verify the user owns the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { createdById: true }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (course.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create the lesson with new structure
    const lesson = await prisma.lesson.create({
      data: { 
        courseId, 
        title,
        description: description || null,
        contentTypes,
        textContent: textContent || null,
        externalLinks,
        videoType: videoType || null,
        videoUrl: videoUrl || null,
        videoPublicId: videoPublicId || null,
        youtubeUrl: youtubeUrl || null,
        order,
        // Keep contentURL for backward compatibility
        contentURL: content || textContent || videoUrl || youtubeUrl || null
      },
    })

    // Clear course cache
    await redis.del(`course:${courseId}:v1`)
    const userCacheKey = `courses:list:v2:${session.user.id}`
    await redis.del(userCacheKey)

    return NextResponse.json(lesson, { status: 201 })
  } catch (e) {
    console.error("Error creating lesson:", e)
    if (e instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: e.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")

    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 })
    }

    // Verify the user owns the course or is enrolled
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { 
        createdById: true,
        enrollments: {
          where: { userId: session.user.id },
          select: { id: true }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const isOwner = course.createdById === session.user.id
    const isEnrolled = course.enrollments.length > 0

    if (!isOwner && !isEnrolled) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: "asc" }
    })

    return NextResponse.json(lessons)
  } catch (e) {
    console.error("Error fetching lessons:", e)
    return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 })
  }
}