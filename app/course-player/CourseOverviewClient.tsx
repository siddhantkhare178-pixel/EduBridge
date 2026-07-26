"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { BookOpen, ArrowRight, CheckCircle } from "lucide-react"

interface CourseWithProgress {
  id: string
  courseId: string
  course: {
    id: string
    title: string
    _count: { lessons: number }
    createdBy: { name: string | null }
  }
  progress: {
    completed: number
    total: number
    percentage: number
  }
}

interface CourseOverviewClientProps {
  courses: CourseWithProgress[]
}

function pageToPath(page: string): string {
  switch (page) {
    case "landing":
      return "/student-dashboard" // For logged-in users, home should go to dashboard
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
      return "/student-dashboard"
  }
}

export function CourseOverviewClient({ courses }: CourseOverviewClientProps) {
  const router = useRouter()

  const handleNavigate = (page: string) => {
    router.push(pageToPath(page))
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="course-player" onNavigate={handleNavigate} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">My Courses</h1>
          <p className="text-muted-foreground">
            Continue learning from where you left off
          </p>
        </div>

        {courses.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No courses enrolled</h3>
            <p className="text-muted-foreground mb-4">
              You haven&apos;t enrolled in any courses yet. Browse our course catalog to get started.
            </p>
            <Button onClick={() => router.push("/courses")}>
              Browse Courses
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((enrollment) => (
              <Card key={enrollment.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                      {enrollment.course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      by {enrollment.course.createdBy.name || "Unknown Instructor"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1 mb-2">
                        <BookOpen className="w-4 h-4" />
                        {enrollment.course._count.lessons} lessons
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {enrollment.progress.completed} of {enrollment.progress.total} completed
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{enrollment.progress.percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enrollment.progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push(`/course-player/${enrollment.courseId}`)}
                    className="w-full flex items-center gap-2"
                  >
                    {enrollment.progress.percentage > 0 ? "Continue Learning" : "Start Learning"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {courses.length > 0 && (
          <Card className="p-6 mt-8">
            <h3 className="text-lg font-semibold mb-4">Learning Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {courses.length}
                </div>
                <div className="text-sm text-muted-foreground">Enrolled Courses</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {courses.reduce((sum, c) => sum + c.progress.completed, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Lessons Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {courses.reduce((sum, c) => sum + c.progress.total, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Lessons</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(courses.reduce((sum, c) => sum + c.progress.percentage, 0) / courses.length)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Progress</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}