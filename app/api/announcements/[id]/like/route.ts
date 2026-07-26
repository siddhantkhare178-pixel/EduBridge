import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const announcementId = id

    // Check if announcement exists and user has access to it
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        course: true
      }
    })

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 })
    }

    // Check if student has access to this announcement
    if (session.user.role === "STUDENT") {
      if (!announcement.isPublic && announcement.courseId) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: session.user.id,
              courseId: announcement.courseId
            }
          }
        })

        if (!enrollment) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
      }
    }

    // Check if already liked
    const existingLike = await prisma.announcementLike.findUnique({
      where: {
        userId_announcementId: {
          userId: session.user.id,
          announcementId
        }
      }
    })

    if (existingLike) {
      return NextResponse.json({ error: "Already liked" }, { status: 400 })
    }

    // Create like
    await prisma.announcementLike.create({
      data: {
        userId: session.user.id,
        announcementId
      }
    })

    // Get updated like count
    const likesCount = await prisma.announcementLike.count({
      where: { announcementId }
    })

    return NextResponse.json({ 
      message: "Announcement liked successfully",
      likesCount,
      isLiked: true
    })
  } catch (error) {
    console.error("Error liking announcement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const announcementId = id

    // Check if like exists
    const existingLike = await prisma.announcementLike.findUnique({
      where: {
        userId_announcementId: {
          userId: session.user.id,
          announcementId
        }
      }
    })

    if (!existingLike) {
      return NextResponse.json({ error: "Like not found" }, { status: 404 })
    }

    // Remove like
    await prisma.announcementLike.delete({
      where: {
        userId_announcementId: {
          userId: session.user.id,
          announcementId
        }
      }
    })

    // Get updated like count
    const likesCount = await prisma.announcementLike.count({
      where: { announcementId }
    })

    return NextResponse.json({ 
      message: "Announcement unliked successfully",
      likesCount,
      isLiked: false
    })
  } catch (error) {
    console.error("Error unliking announcement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}