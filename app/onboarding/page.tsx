import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import OnboardingForm from "./OnboardingForm"

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const role = (session.user as any).role as "STUDENT" | "TEACHER" | null
  
  // Only redirect if role is explicitly set (not null/undefined)
  // This prevents redirect loops when user is in the process of setting their role
  if (role === "STUDENT") {
    redirect("/student-dashboard")
  }
  if (role === "TEACHER") {
    redirect("/teacher-dashboard")
  }

  // Role is null/undefined - show onboarding form
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <OnboardingForm />
    </div>
  )
}
