import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createAnnouncementSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
    content: z.string().min(1, "Content is required").max(2000, "Content too long"),
    courseId: z.string().optional(),
    isPublic: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authConfig)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const courseId = searchParams.get("courseId")
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "10")
        const skip = (page - 1) * limit

        let whereClause: any = {}

        if (session.user.role === "STUDENT") {
            // Students see public announcements and announcements from courses they're enrolled in
            const enrolledCourses = await prisma.enrollment.findMany({
                where: { userId: session.user.id },
                select: { courseId: true }
            })

            const enrolledCourseIds = enrolledCourses.map(e => e.courseId)

            whereClause = {
                OR: [
                    { isPublic: true },
                    { courseId: { in: enrolledCourseIds } }
                ]
            }

            if (courseId) {
                whereClause = {
                    AND: [
                        whereClause,
                        { courseId }
                    ]
                }
            }
        } else if (session.user.role === "TEACHER") {
            // Teachers see their own announcements
            whereClause = { authorId: session.user.id }

            if (courseId) {
                whereClause.courseId = courseId
            }
        }

        const announcements = await prisma.announcement.findMany({
            where: whereClause,
            include: {
                author: {
                    select: { id: true, name: true, image: true }
                },
                course: {
                    select: { id: true, title: true }
                },
                likes: {
                    select: { userId: true }
                },
                _count: {
                    select: { likes: true }
                }
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit
        })

        const total = await prisma.announcement.count({ where: whereClause })

        const announcementsWithLikeStatus = announcements.map(announcement => ({
            ...announcement,
            isLiked: announcement.likes.some(like => like.userId === session.user.id),
            likesCount: announcement._count.likes
        }))

        return NextResponse.json({
            announcements: announcementsWithLikeStatus,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("Error fetching announcements:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authConfig)
        if (!session?.user?.id || session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = createAnnouncementSchema.parse(body)

        // If courseId is provided, verify the teacher owns the course
        if (validatedData.courseId) {
            const course = await prisma.course.findFirst({
                where: {
                    id: validatedData.courseId,
                    createdById: session.user.id
                }
            })

            if (!course) {
                return NextResponse.json({ error: "Course not found or unauthorized" }, { status: 404 })
            }
        }

        const announcement = await prisma.announcement.create({
            data: {
                ...validatedData,
                authorId: session.user.id
            },
            include: {
                author: {
                    select: { id: true, name: true, image: true }
                },
                course: {
                    select: { id: true, title: true }
                },
                _count: {
                    select: { likes: true }
                }
            }
        })

        return NextResponse.json({
            ...announcement,
            isLiked: false,
            likesCount: 0
        }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        console.error("Error creating announcement:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}