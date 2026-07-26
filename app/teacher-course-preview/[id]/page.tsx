import { getCourseById } from "@/app/actions/courses"
import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { TeacherCoursePreviewClient } from "./TeacherCoursePreviewClient"
import type { Lesson } from "@prisma/client"

export default async function TeacherCoursePreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const userRole = (session.user as any).role

    // Only allow teachers to access this preview
    if (userRole !== "TEACHER") {
        redirect("/student-dashboard")
    }

    const course = await getCourseById(id)
    if (!course) return notFound()

    // Only allow teachers to preview their own courses
    if (course.createdById !== session.user.id) {
        redirect("/teacher-dashboard")
    }

    // Serialize the course data to handle Decimal types
    const serializedCourse = {
        ...course,
        price: course.price.toString(), // Convert Decimal to string
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        lessons: course.lessons.map((lesson: Lesson) => ({
            ...lesson,
            createdAt: lesson.createdAt.toISOString(),
            updatedAt: lesson.updatedAt.toISOString(),
        }))
    }

    return <TeacherCoursePreviewClient course={serializedCourse} />
}