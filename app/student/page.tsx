import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { StudentDashboard } from "@/components/student-dashboard"

export default async function StudentPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const role = (session.user as any).role
  if (role === "TEACHER") redirect("/teacher")
  if (role !== "STUDENT") redirect("/onboarding")
  return <StudentDashboard />
}
