"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const PROGRESS_LIST = (userId: string, courseId: string) => `progress:${userId}:${courseId}:v1`

const progressInput = z.object({
  lessonId: z.string(),
  percent: z.number().min(0).max(100),
  completedAt: z.date().optional(),
})

export async function upsertProgress(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const { lessonId, percent, completedAt } = progressInput.parse(input)

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { courseId: true } })
  if (!lesson) throw new Error("Lesson not found")

  const progress = await prisma.progress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    update: { percent, completedAt: completedAt ?? null },
    create: { userId: session.user.id, lessonId, percent, completedAt: completedAt ?? null },
  })

  await redis.del(PROGRESS_LIST(session.user.id, lesson.courseId))
  revalidatePath(`/courses/${lesson.courseId}`)
  return progress
}

export async function getMyCourseProgress(courseId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const key = PROGRESS_LIST(session.user.id, courseId)
  const cached = await redis.get(key)
  if (cached) return cached

  const lessons = await prisma.lesson.findMany({ where: { courseId }, select: { id: true, order: true } })
  const progresses = await prisma.progress.findMany({
    where: { userId: session.user.id, lessonId: { in: lessons.map((l: { id: string; order: number }) => l.id) } },
  })
  const byLesson = new Map<string, typeof progresses[number]>(
    progresses.map((p: typeof progresses[number]) => [p.lessonId, p])
  )
  const ordered = lessons
    .sort((a: { id: string; order: number }, b: { id: string; order: number }) => a.order - b.order)
    .map((l: { id: string; order: number }) => ({ lessonId: l.id, order: l.order, progress: byLesson.get(l.id) ?? null }))

  await redis.set(key, ordered, { ex: 60 })
  return ordered
}
