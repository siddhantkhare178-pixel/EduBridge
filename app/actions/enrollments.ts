"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import { revalidatePath } from "next/cache"

const ENROLLMENTS_LIST = (userId: string) => `enrollments:${userId}:v1`

export async function enrollInCourse(courseId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    update: { status: "active" },
    create: { userId: session.user.id, courseId, status: "active" },
  })

  await redis.del(ENROLLMENTS_LIST(session.user.id))
  revalidatePath("/dashboard")
  revalidatePath(`/courses/${courseId}`)
  return enrollment
}

export async function myEnrollments() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const key = ENROLLMENTS_LIST(session.user.id)
  const cached = await redis.get(key)
  if (cached) return cached

  const data = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          _count: { select: { lessons: true, enrollments: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  await redis.set(key, data, { ex: 60 })
  return data
}
