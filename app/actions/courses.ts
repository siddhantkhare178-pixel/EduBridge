"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const COURSE_LIST_KEY = "courses:list:v1"
const COURSE_KEY = (id: string) => `courses:${id}:v1`

const courseInput = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.coerce.number().nonnegative(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
})

export async function getCourses() {
  const cached = await redis.get(COURSE_LIST_KEY)
  if (cached) return cached

  const data = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { lessons: true, enrollments: true } },
      createdBy: { select: { id: true, name: true, image: true } },
    },
  })

  await redis.set(COURSE_LIST_KEY, data, { ex: 60 })
  return data
}

export async function getCourseById(id: string) {
  const key = COURSE_KEY(id)
  const cached = await redis.get(key)
  if (cached) return cached

  const data = await prisma.course.findUnique({
    where: { id },
    include: {
      lessons: { orderBy: { order: "asc" } },
      createdBy: { select: { id: true, name: true, image: true } },
      _count: { select: { enrollments: true } },
    },
  })
  if (data) await redis.set(key, data, { ex: 60 })
  return data
}

export async function createCourse(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const { title, description, price, status } = courseInput.parse(input)

  const course = await prisma.course.create({
    data: {
      title,
      description,
      price,
      status,
      createdById: session.user.id,
    },
  })

  await redis.del(COURSE_LIST_KEY)
  revalidatePath("/courses")
  return course
}

export async function updateCourse(id: string, input: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const existing = await prisma.course.findUnique({ where: { id } })
  if (!existing) throw new Error("Not found")
  if (existing.createdById !== session.user.id) throw new Error("Forbidden")

  const { title, description, price, status } = courseInput.partial().parse(input)

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(status !== undefined ? { status } : {}),
    },
  })

  await redis.del(COURSE_LIST_KEY)
  await redis.del(COURSE_KEY(id))
  revalidatePath("/courses")
  revalidatePath(`/courses/${id}`)
  return course
}

export async function deleteCourse(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const existing = await prisma.course.findUnique({ where: { id } })
  if (!existing) throw new Error("Not found")
  if (existing.createdById !== session.user.id) throw new Error("Forbidden")

  await prisma.course.delete({ where: { id } })
  await redis.del(COURSE_LIST_KEY)
  await redis.del(COURSE_KEY(id))
  revalidatePath("/courses")
  revalidatePath(`/courses/${id}`)
  return { ok: true }
}