import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const PUBLIC_COURSES_KEY = "courses:public:v1"

export async function GET() {
  try {
    const cached = await redis.get(PUBLIC_COURSES_KEY)
    if (cached) return NextResponse.json(cached)

    // Fetch only published courses for public viewing
    const data = await prisma.course.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { lessons: true, enrollments: true } },
        createdBy: { select: { id: true, name: true, image: true } },
      },
    })
    await redis.set(PUBLIC_COURSES_KEY, data, { ex: 300 }) // Cache for 5 minutes
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}