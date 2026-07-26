import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { TeacherProfileClient } from "./TeacherProfileClient"

export default async function Page() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  const role = (session.user as any).role
  if (role === "STUDENT") redirect("/student/profile")
  if (role !== "TEACHER") redirect("/onboarding")

  return <TeacherProfileClient />
}