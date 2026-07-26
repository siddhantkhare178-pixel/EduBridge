import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { StudentDashboardClient } from "./StudentDashboardClient"

export default async function Page() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  const role = (session.user as any).role
  
  // If user is a teacher, redirect to teacher dashboard
  if (role === "TEACHER") redirect("/teacher-dashboard")
  
  // Only redirect to onboarding if role is explicitly null/undefined
  // Give it a moment - the JWT callback should have fetched the role
  if (role === null || role === undefined) {
    // Wait a bit longer for JWT callback to fetch from database
    await new Promise(resolve => setTimeout(resolve, 200))
    // Re-check session after delay
    const updatedSession = await auth()
    const updatedRole = (updatedSession?.user as any)?.role
    if (updatedRole === "STUDENT") {
      return <StudentDashboardClient />
    }
    if (updatedRole === "TEACHER") {
      redirect("/teacher-dashboard")
    }
    // Still no role after retry, redirect to onboarding
    redirect("/onboarding")
  }
  
  // Role is set and is STUDENT
  if (role === "STUDENT") {
    return <StudentDashboardClient />
  }
  
  // Fallback to onboarding
  redirect("/onboarding")
}


