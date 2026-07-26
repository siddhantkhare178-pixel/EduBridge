import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  content: z.string().min(1, "Content is required").max(2000, "Content too long").optional(),
  isPublic: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateAnnouncementSchema.parse(body)

    // Verify the teacher owns the announcement
    const existingAnnouncement = await prisma.announcement.findFirst({
      where: {
        id: id,
        authorId: session.user.id
      }
    })

    if (!existingAnnouncement) {
      return NextResponse.json({ error: "Announcement not found or unauthorized" }, { status: 404 })
    }

    const announcement = await prisma.announcement.update({
      where: { id: id },
      data: validatedData,
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
      }
    })

    return NextResponse.json({
      ...announcement,
      isLiked: announcement.likes.some(like => like.userId === session.user.id),
      likesCount: announcement._count.likes
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating announcement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify the teacher owns the announcement
    const existingAnnouncement = await prisma.announcement.findFirst({
      where: {
        id: id,
        authorId: session.user.id
      }
    })

    if (!existingAnnouncement) {
      return NextResponse.json({ error: "Announcement not found or unauthorized" }, { status: 404 })
    }

    await prisma.announcement.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: "Announcement deleted successfully" })
  } catch (error) {
    console.error("Error deleting announcement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}