import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id as string

    // Get teacher's courses
    const courses = await prisma.course.findMany({
      where: { createdById: userId },
      include: {
        enrollments: true,
        payments: {
          where: { status: "succeeded" }
        }
      }
    })

    const totalCourses = courses.length
    const publishedCourses = courses.filter(course => course.status === "published").length
    
    // Calculate total students (unique enrollments across all courses)
    const allEnrollments = courses.flatMap(course => course.enrollments)
    const uniqueStudentIds = new Set(allEnrollments.map(enrollment => enrollment.userId))
    const totalStudents = uniqueStudentIds.size

    // Calculate total revenue
    const totalRevenue = courses.reduce((sum, course) => {
      const courseRevenue = course.payments.reduce((courseSum, payment) => {
        return courseSum + Number(payment.amount)
      }, 0)
      return sum + courseRevenue
    }, 0)

    return NextResponse.json({
      totalCourses,
      publishedCourses,
      totalStudents,
      totalRevenue: Math.round(totalRevenue)
    })
  } catch (error) {
    console.error("Teacher stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}