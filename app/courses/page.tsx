import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { CoursesClient } from "./CoursesClient"

export default async function CoursesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  const role = (session.user as any).role
  
  // Only allow students to access courses page
  if (role === "TEACHER") {
    redirect("/teacher-dashboard")
  }
  
  // If no role set, redirect to onboarding
  if (!role) {
    redirect("/onboarding")
  }
  
  return <CoursesClient />
}
