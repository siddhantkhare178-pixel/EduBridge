"use client"

import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { StudentDashboard } from "@/components/student-dashboard"

function pageToPath(page: string): string {
  switch (page) {
    case "landing":
      return "/"
    case "student-dashboard":
      return "/student-dashboard"
    case "profile":
      return "/student/profile"
    case "course-player":
      return "/course-player"
    case "ai-tutor":
      return "/ai-tutor"
    case "teacher-dashboard":
      return "/teacher-dashboard"
    case "community-forum":
      return "/community-forum"
    case "my-courses":
      return "/student/my-courses"
    default:
      return "/"
  }
}

export function StudentDashboardClient() {
  const router = useRouter()
  const onNavigate = (page: string) => router.push(pageToPath(page))

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation currentPage="student-dashboard" onNavigate={onNavigate} />
      <StudentDashboard onNavigate={onNavigate} />
    </div>
  )
}


