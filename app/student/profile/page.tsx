import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { StudentProfileClient } from "./StudentProfileClient"

export default async function Page() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  const role = (session.user as any).role
  if (role === "TEACHER") redirect("/teacher/profile")
  if (role !== "STUDENT") redirect("/onboarding")

  return <StudentProfileClient />
}