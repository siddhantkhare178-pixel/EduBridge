"use client"

import { Button } from "@/components/ui/button"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { BookOpen, Home, LogOut, User, Brain, Megaphone } from "lucide-react"

interface NavigationProps {
  currentPage: string
  onNavigate: (page: string) => void
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const router = useRouter()
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/")
    router.refresh()
  }

  const getHomePage = () => {
    const role = (session?.user as any)?.role
    if (role === "STUDENT") return "student-dashboard"
    if (role === "TEACHER") return "teacher-dashboard"
    return "landing"
  }

  const handleProfileClick = () => {
    const role = (session?.user as any)?.role
    if (role === "STUDENT") {
      router.push("/student/profile")
    } else if (role === "TEACHER") {
      router.push("/teacher/profile")
    } else {
      router.push("/student/profile") // Default fallback
    }
  }

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate(getHomePage())}
            className="flex items-center gap-2 hover:text-primary transition-colors min-h-[44px]"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground hidden sm:inline">EduBridge</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => onNavigate(getHomePage())}
              aria-label="Home"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                currentPage === getHomePage() ? "bg-primary/10 text-primary" : "text-foreground hover:text-primary"
              }`}
            >
              <Home className="w-5 h-5" />
            </button>
            {session?.user && (
              <button
                onClick={() => router.push("/announcements")}
                aria-label="Announcements"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  currentPage === "announcements" ? "bg-primary/10 text-primary" : "text-foreground hover:text-primary"
                }`}
              >
                <Megaphone className="w-5 h-5" />
              </button>
            )}
            {session?.user && (session.user as any)?.role === "STUDENT" && (
              <button
                onClick={() => router.push("/quiz")}
                aria-label="AI Quiz"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  currentPage === "quiz" ? "bg-primary/10 text-primary" : "text-foreground hover:text-primary"
                }`}
              >
                <Brain className="w-5 h-5" />
              </button>
            )}
            {session?.user && (
              <button
                onClick={handleProfileClick}
                aria-label="Profile"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  currentPage === "profile" ? "bg-primary/10 text-primary" : "text-foreground hover:text-primary"
                }`}
              >
                <User className="w-5 h-5" />
              </button>
            )}
            <Button
              variant="ghost"
              onClick={handleLogout}
              aria-label="Logout"
              className="text-foreground hover:text-primary min-h-[44px]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
