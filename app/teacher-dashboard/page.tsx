import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { TeacherDashboardClient } from "./TeacherDashboardClient"

export default async function Page() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  const role = (session.user as any).role
  
  // If user is a student, redirect to student dashboard
  if (role === "STUDENT") redirect("/student-dashboard")
  
  // Only redirect to onboarding if role is explicitly null/undefined
  // Give it a moment - the JWT callback should have fetched the role
  if (role === null || role === undefined) {
    // Wait a bit longer for JWT callback to fetch from database
    await new Promise(resolve => setTimeout(resolve, 200))
    // Re-check session after delay
    const updatedSession = await auth()
    const updatedRole = (updatedSession?.user as any)?.role
    if (updatedRole === "TEACHER") {
      return <TeacherDashboardClient />
    }
    if (updatedRole === "STUDENT") {
      redirect("/student-dashboard")
    }
    // Still no role after retry, redirect to onboarding
    redirect("/onboarding")
  }
  
  // Role is set and is TEACHER
  if (role === "TEACHER") {
    return <TeacherDashboardClient />
  }
  
  // Fallback to onboarding
  redirect("/onboarding")
}


