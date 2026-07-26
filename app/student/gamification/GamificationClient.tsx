"use client"

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { GamificationDashboard } from '@/components/gamification/gamification-dashboard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy } from 'lucide-react'

export function GamificationClient() {
  const router = useRouter()

  const handleNavigate = (page: string) => {
    switch (page) {
      case "landing":
        router.push("/")
        break
      case "courses":
        router.push("/courses")
        break
      case "student-dashboard":
        router.push("/student-dashboard")
        break
      case "ai-tutor":
        router.push("/ai-tutor")
        break
      case "community-forum":
        router.push("/community-forum")
        break
      case "profile":
        router.push("/student/profile")
        break
      case "my-courses":
        router.push("/student/my-courses")
        break
      case "recommendations":
        router.push("/student/recommendations")
        break
      default:
        router.push(`/${page}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="student-dashboard" onNavigate={handleNavigate} />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs sm:text-sm w-fit"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground break-words">
                  Your Learning Journey
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Track your progress, achievements, and learning streaks
                </p>
              </div>
            </div>
          </div>

          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your achievements...</p>
              </div>
            </div>
          }>
            <GamificationDashboard />
          </Suspense>
        </div>
      </main>
    </div>
  )
}