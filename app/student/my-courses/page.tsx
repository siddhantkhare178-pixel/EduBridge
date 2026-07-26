import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { MyCoursesClient } from "./MyCoursesClient"

export default async function MyCoursesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  const role = (session.user as any).role
  
  // Only allow students to access this page
  if (role === "TEACHER") {
    redirect("/teacher-dashboard")
  }
  
  // If no role set, redirect to onboarding
  if (!role) {
    redirect("/onboarding")
  }
  
  return <MyCoursesClient />
}