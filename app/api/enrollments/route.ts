import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const ENROLLMENTS_LIST = (userId: string) => `enrollments:${userId}:v1`

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const key = ENROLLMENTS_LIST(session.user.id)
  const cached = await redis.get(key)
  if (cached) return NextResponse.json(cached)

  const data = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: { include: { _count: { select: { lessons: true, enrollments: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })
  await redis.set(key, data, { ex: 60 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { courseId } = await req.json().catch(() => ({}))
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 })

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    update: { status: "active" },
    create: { userId: session.user.id, courseId, status: "active" },
  })
  await redis.del(ENROLLMENTS_LIST(session.user.id))
  return NextResponse.json(enrollment, { status: 201 })
}
