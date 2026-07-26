"use client"

import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { AITutor } from "@/components/ai-tutor"

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

export default function Page() {
  const router = useRouter()
  const onNavigate = (page: string) => router.push(pageToPath(page))

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="ai-tutor" onNavigate={onNavigate} />
      <AITutor onNavigate={onNavigate} />
    </div>
  )
}


