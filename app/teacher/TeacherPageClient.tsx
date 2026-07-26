"use client"

import { useRouter } from "next/navigation"
import { TeacherDashboard } from "@/components/teacher-dashboard"

function pageToPath(page: string): string {
  console.log("Navigating to page:", page) // Debug log
  switch (page) {
    case "landing":
      return "/"
    case "student-dashboard":
      return "/student-dashboard"
    case "profile":
      return "/teacher/profile"
    case "course-player":
      return "/course-player"
    case "ai-tutor":
      return "/ai-tutor"
    case "teacher-dashboard":
      return "/teacher-dashboard"
    case "community-forum":
      return "/community-forum"
    case "create-course":
      return "/create-course"
    case "manage-course":
      return "/manage-course"
    default:
      console.log("Unknown page, defaulting to /:", page)
      return "/"
  }
}

export function TeacherPageClient() {
  const router = useRouter()
  const onNavigate = (page: string) => router.push(pageToPath(page))

  return <TeacherDashboard onNavigate={onNavigate} />
}