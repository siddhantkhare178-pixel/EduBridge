"use client"

import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { LandingPage } from "@/components/landing-page"

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
    default:
      return "/"
  }
}

export default function Home() {
  const router = useRouter()
  const { status } = useSession()

  const handleNavigate = (page: string) => {
    // Landing page buttons should go to login/signup for authentication
    if (page === "student-dashboard" || page === "teacher-dashboard" || page === "community-forum") {
      // Redirect to signup page for new users - these pages require authentication
      router.push("/signup")
      return
    }
    
    // For other pages, navigate normally
    router.push(pageToPath(page))
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingPage onNavigate={handleNavigate} />
    </div>
  )
}
