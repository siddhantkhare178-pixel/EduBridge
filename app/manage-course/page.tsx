import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ManageCoursesClient } from "./ManageCoursesClient"

export default async function ManageCoursesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const role = (session.user as any).role
  if (role === "STUDENT") redirect("/student")
  if (role !== "TEACHER") redirect("/onboarding")
  return <ManageCoursesClient />
}