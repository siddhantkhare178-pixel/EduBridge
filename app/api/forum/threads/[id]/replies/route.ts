import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const REPLIES_LIST = (threadId: string, page?: number) => `replies:${threadId}:v1:${page ?? 1}`

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: threadId } = await context.params
  const url = request.nextUrl
  const search = new URL(url).searchParams
  const page = Number(search.get("page") || 1)
  const pageSize = Number(search.get("pageSize") || 20)

  const key = REPLIES_LIST(threadId, page)
  const cached = await redis.get(key)
  if (cached) return NextResponse.json(cached)

  const [items, total] = await Promise.all([
    prisma.reply.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, name: true, image: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.reply.count({ where: { threadId } }),
  ])

  const result = { items, page, pageSize, total, pages: Math.ceil(total / pageSize) }
  await redis.set(key, result, { ex: 60 })
  return NextResponse.json(result)
}

const createReplyInput = z.object({ body: z.string().min(1) })

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: threadId } = await context.params
  const { body } = createReplyInput.parse(await request.json())

  const reply = await prisma.reply.create({ data: { threadId, body, authorId: session.user.id } })
  await redis.del(REPLIES_LIST(threadId, 1))
  return NextResponse.json(reply, { status: 201 })
}