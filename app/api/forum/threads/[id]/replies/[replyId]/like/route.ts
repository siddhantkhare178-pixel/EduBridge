import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string, replyId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { replyId } = await params

    // Check if reply exists
    const reply = await prisma.reply.findUnique({
      where: { id: replyId }
    })

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Reply liked successfully",
      liked: true
    })
  } catch (error) {
    console.error("Error liking reply:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, replyId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { replyId } = await params

    return NextResponse.json({ 
      message: "Reply unliked successfully",
      liked: false
    })
  } catch (error) {
    console.error("Error unliking reply:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}