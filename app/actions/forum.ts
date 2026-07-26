"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const THREAD_LIST = (courseId?: string, page?: number, q?: string) =>
  `threads:list:v1:${courseId ?? "all"}:${page ?? 1}:${q ?? ""}`
const THREAD_KEY = (id: string) => `threads:${id}:v1`
const REPLIES_LIST = (threadId: string, page?: number) => `replies:${threadId}:v1:${page ?? 1}`

const createThreadInput = z.object({
  title: z.string().min(3),
  body: z.string().min(10),
  courseId: z.string().optional(),
})

const createReplyInput = z.object({
  threadId: z.string(),
  body: z.string().min(1),
})

export async function listThreads(params: { courseId?: string; page?: number; pageSize?: number; q?: string } = {}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  const q = params.q?.trim() || ""

  const cacheKey = THREAD_LIST(params.courseId, page, q)
  const cached = await redis.get(cacheKey)
  if (cached) return cached

  const where = {
    ...(params.courseId ? { courseId: params.courseId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { body: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

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
  return result
}

export async function getThread(id: string) {
  const cached = await redis.get(THREAD_KEY(id))
  if (cached) return cached
  const data = await prisma.thread.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, image: true } }, _count: { select: { replies: true } } },
  })
  if (data) await redis.set(THREAD_KEY(id), data, { ex: 120 })
  return data
}

export async function createThread(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const { title, body, courseId } = createThreadInput.parse(input)

  const thread = await prisma.thread.create({
    data: { title, body, courseId: courseId ?? null, authorId: session.user.id },
  })

  await redis.del(THREAD_LIST("all", 1, ""))
  if (courseId) await redis.del(THREAD_LIST(courseId, 1, ""))
  revalidatePath("/forum")
  if (courseId) revalidatePath(`/courses/${courseId}`)
  return thread
}

export async function listReplies(threadId: string, page = 1, pageSize = 20) {
  const key = REPLIES_LIST(threadId, page)
  const cached = await redis.get(key)
  if (cached) return cached

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
  return result
}

export async function createReply(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const { threadId, body } = createReplyInput.parse(input)

  const reply = await prisma.reply.create({ data: { threadId, body, authorId: session.user.id } })

  await redis.del(REPLIES_LIST(threadId, 1))
  await redis.del(THREAD_KEY(threadId))
  revalidatePath(`/forum/${threadId}`)
  return reply
}
