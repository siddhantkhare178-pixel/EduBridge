import { getCourseById } from "@/app/actions/courses"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { CoursePlayerClient } from "./CoursePlayerClient"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const course = await getCourseById(id)
  if (!course) return notFound()

  // Check if user is enrolled in the course
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: id
      }
    }
  })

  if (!enrollment) {
    redirect(`/courses/${id}`) // Redirect to course details page if not enrolled
  }

  // Serialize the course data to handle Decimal types
  const serializedCourse = {
    ...course,
    price: course.price.toString(), // Convert Decimal to string
    createdAt: course.createdAt instanceof Date ? course.createdAt.toISOString() : course.createdAt,
    updatedAt: course.updatedAt instanceof Date ? course.updatedAt.toISOString() : course.updatedAt,
    lessons: course.lessons?.map((lesson: any) => ({
      ...lesson,
      createdAt: lesson.createdAt instanceof Date ? lesson.createdAt.toISOString() : lesson.createdAt,
      updatedAt: lesson.updatedAt instanceof Date ? lesson.updatedAt.toISOString() : lesson.updatedAt,
    })) || []
  }

  return <CoursePlayerClient course={serializedCourse} />
}