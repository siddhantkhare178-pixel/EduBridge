"use client"

import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navigation } from "@/components/navigation"
import { CommunityForum } from "@/components/community-forum"
import { useEffect } from "react"

function pageToPath(page: string): string {
  switch (page) {
    case "landing":
      return "/"
    case "student-dashboard":
      return "/student-dashboard"
    case "course-player":
      return "/course-player"
    case "ai-tutor":
      return "/ai-tutor"
    case "teacher-dashboard":
      return "/teacher-dashboard"
    case "community-forum":
      return "/community-forum"
    case "create-thread":
      return "/community-forum/create-thread"
    default:
      return "/"
  }
}

export default function Page() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const onNavigate = (page: string) => router.push(pageToPath(page))

  useEffect(() => {
    if (status === "loading") return // Still loading
    
    if (!session) {
      // Redirect to login if not authenticated
      router.push("/login")
      return
    }
  }, [session, status, router])

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="community-forum" onNavigate={onNavigate} />
      <CommunityForum onNavigate={onNavigate} />
    </div>
  )
}


