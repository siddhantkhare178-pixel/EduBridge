import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authConfig } from "@/lib/auth"
import { AnnouncementsClient } from "./AnnouncementsClient"

export default async function AnnouncementsPage() {
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    redirect("/login")
  }

  return <AnnouncementsClient />
}