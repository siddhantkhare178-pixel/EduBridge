"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Announcements } from "@/components/announcements"

function pageToPath(page: string): string {
  switch (page) {
    case "landing":
      return "/"
    case "student-dashboard":
      return "/student-dashboard"
    case "teacher-dashboard":
      return "/teacher-dashboard"
    case "announcements":
      return "/announcements"
    case "course-player":
      return "/course-player"
    case "ai-tutor":
      return "/ai-tutor"
    case "community-forum":
      return "/community-forum"
    case "create-course":
      return "/create-course"
    default:
      return "/"
  }
}

export function AnnouncementsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Derive shouldOpenCreate from searchParams instead of using state
  const shouldOpenCreate = searchParams.get("create") === "true"
  
  const onNavigate = (page: string) => router.push(pageToPath(page))

  useEffect(() => {
    // Clean up the URL if create param is present
    if (searchParams.get("create") === "true") {
      const url = new URL(window.location.href)
      url.searchParams.delete("create")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="announcements" onNavigate={onNavigate} />
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <Announcements autoOpenCreate={shouldOpenCreate} />
      </main>
    </div>
  )
}