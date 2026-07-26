import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const THREAD_LIST = (courseId?: string, page?: number, q?: string) =>
  `threads:list:v1:${courseId ?? "all"}:${page ?? 1}:${q ?? ""}`

const createThreadInput = z.object({
  title: z.string().min(3),
  body: z.string().min(10),
  courseId: z.string().optional(),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get("page") || 1)
  const pageSize = Number(searchParams.get("pageSize") || 10)
  const courseId = searchParams.get("courseId") || undefined
  const q = (searchParams.get("q") || "").trim()

  const cacheKey = THREAD_LIST(courseId, page, q)
  const cached = await redis.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  const where: any = {}
  if (courseId) where.courseId = courseId
  if (q) where.OR = [{ title: { contains: q, mode: "insensitive" } }, { body: { contains: q, mode: "insensitive" } }]

  const [items, total] = await Promise.all([
    prisma.thread.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, image: true } }, _count: { select: { replies: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.thread.count({ where }),
  ])

  const result = { items, page, pageSize, total, pages: Math.ceil(total / pageSize) }
  await redis.set(cacheKey, result, { ex: 60 })
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { title, body, courseId } = createThreadInput.parse(await req.json())
  const thread = await prisma.thread.create({
    data: { title, body, courseId: courseId ?? null, authorId: session.user.id },
    include: { author: { select: { id: true, name: true, image: true } }, _count: { select: { replies: true } } }
  })

  // Clear relevant caches
  await redis.del(THREAD_LIST(undefined, 1, ""))
  if (courseId) await redis.del(THREAD_LIST(courseId, 1, ""))

  return NextResponse.json(thread, { status: 201 })
}
