import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const THREAD_KEY = (id: string) => `threads:${id}:v1`
const REPLIES_LIST = (threadId: string, page?: number) => `replies:${threadId}:v1:${page ?? 1}`

const replyInput = z.object({ threadId: z.string(), body: z.string().min(1) })

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const cached = await redis.get(THREAD_KEY(id))
  if (cached) return NextResponse.json(cached)
  const data = await prisma.thread.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, image: true } }, _count: { select: { replies: true } } },
  })
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await redis.set(THREAD_KEY(id), data, { ex: 120 })
  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await context.params
  const { body } = replyInput.parse({ ...(await request.json()), threadId: id })

  const reply = await prisma.reply.create({ data: { threadId: id, body, authorId: session.user.id } })
  await redis.del(REPLIES_LIST(id, 1))
  await redis.del(THREAD_KEY(id))
  return NextResponse.json(reply, { status: 201 })
}
