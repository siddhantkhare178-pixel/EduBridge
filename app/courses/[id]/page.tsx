import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { CourseDetailClient } from "./CourseDetailClient"

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  const role = (session.user as any).role
  
  // Only allow students to access course detail pages
  if (role === "TEACHER") {
    redirect("/teacher-dashboard")
  }
  
  // If no role set, redirect to onboarding
  if (!role) {
    redirect("/onboarding")
  }
  
  return <CourseDetailClient courseId={id} />
}