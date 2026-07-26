"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { BookOpen, Clock, Award, Users, TrendingUp, Play, MessageCircle, Brain, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { GamificationDashboard } from "@/components/gamification/gamification-dashboard"
import { PointsDisplay } from "@/components/gamification/points-display"
import { StreakCounter } from "@/components/gamification/streak-counter"
import { CourseDownload } from "@/components/course-download"
import { useOffline } from "@/hooks/use-offline"

interface StudentDashboardProps {
  onNavigate?: (page: string) => void
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { } = useOffline() // Keep hook for potential future use
  const [enrollments, setEnrollments] = useState<any[] | null>(null)
  const [publicCourses, setPublicCourses] = useState<any[] | null>(null)
  const [dashboardStats, setDashboardStats] = useState<any | null>(null)
  const [gamificationStats, setGamificationStats] = useState<any | null>(null)
  const [learningTimeData, setLearningTimeData] = useState<any[]>([
    { day: "Mon", hours: 0 },
    { day: "Tue", hours: 0 },
    { day: "Wed", hours: 0 },
    { day: "Thu", hours: 0 },
    { day: "Fri", hours: 0 },
    { day: "Sat", hours: 0 },
    { day: "Sun", hours: 0 },
  ])

  const loadGamificationStats = async () => {
    try {
      const gamificationRes = await fetch("/api/gamification/stats", { cache: "no-store" })
      if (gamificationRes.ok) {
        const gamificationData = await gamificationRes.json()
        setGamificationStats(gamificationData)
      }
    } catch (error) {
      console.error('Error loading gamification stats:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load enrollments
        const enrollmentsRes = await fetch("/api/enrollments", { cache: "no-store" })
        if (enrollmentsRes.ok) {
          const enrollmentsData = await enrollmentsRes.json()
          setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : [])
        }

        // Load dashboard stats
        const statsRes = await fetch("/api/dashboard/stats", { cache: "no-store" })
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setDashboardStats(statsData)
        }

        // Load public courses for recommendations
        const coursesRes = await fetch("/api/courses/public", { cache: "no-store" })
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json()
          setPublicCourses(Array.isArray(coursesData) ? coursesData : [])
        }

        // Load gamification stats
        await loadGamificationStats()

        // Load learning time data
        try {
          const learningTimeRes = await fetch("/api/learning-time?days=7", { cache: "no-store" })
          if (learningTimeRes.ok) {
            const learningTimeData = await learningTimeRes.json()
            setLearningTimeData(learningTimeData.dailyData || [])
          }
        } catch (error) {
          console.error('Error loading learning time data:', error)
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()

    // Listen for focus events to refresh data when returning to the page
    const handleFocus = () => {
      loadGamificationStats()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const allCurrentCourses = useMemo(() => {
    if (!dashboardStats?.courseProgresses) {
      return (enrollments ?? []).map((e) => ({
        title: e.course?.title ?? "Course",
        instructor: `by ${e.course?.createdBy?.name ?? "Instructor"}`,
        level: e.course?.price && Number(e.course.price) > 0 ? "Paid" : "Free",
        progress: 0,
        id: e.courseId as string,
      }))
    }

    return dashboardStats.courseProgresses.map((cp: any) => {
      const enrollment = enrollments?.find(e => e.courseId === cp.courseId)
      return {
        title: cp.title,
        instructor: `by ${enrollment?.course?.createdBy?.name ?? "Instructor"}`,
        level: enrollment?.course?.price && Number(enrollment.course.price) > 0 ? "Paid" : "Free",
        progress: cp.progress,
        id: cp.courseId,
      }
    })
  }, [enrollments, dashboardStats])

  // Limit to 3 courses for dashboard display
  const currentCourses = useMemo(() => {
    return allCurrentCourses.slice(0, 3)
  }, [allCurrentCourses])

  const dynamicStats = useMemo(() => {
    const stats = dashboardStats || {
      activeCourses: 0,
      completedCourses: 0,
      avgProgress: 0,
      totalLessonsCompleted: 0,
      totalLearningHours: 0
    }

    return [
      {
        label: "Active Courses",
        value: stats.activeCourses.toString(),
        icon: BookOpen,
        color: "bg-primary/10 text-primary"
      },
      {
        label: "Completed",
        value: stats.completedCourses.toString(),
        icon: Award,
        color: "bg-secondary/10 text-secondary"
      },
      {
        label: "Learning Hours",
        value: `${stats.totalLearningHours}h`,
        icon: Clock,
        color: "bg-accent/10 text-accent"
      },
      {
        label: "Lessons Done",
        value: stats.totalLessonsCompleted.toString(),
        icon: TrendingUp,
        color: "bg-primary/10 text-primary"
      },
    ]
  }, [dashboardStats])

  const dynamicProgressData = useMemo(() => {
    if (!dashboardStats || dashboardStats.activeCourses === 0) {
      return [{ name: "No courses", value: 100, color: "var(--muted)" }]
    }

    const completed = dashboardStats.completedCourses
    const total = dashboardStats.activeCourses
    const inProgress = total - completed

    return [
      { name: "Completed", value: completed, color: "var(--primary)" },
      { name: "In Progress", value: inProgress, color: "var(--secondary)" },
    ].filter(item => item.value > 0)
  }, [dashboardStats])

  const recommendations = useMemo(() => {
    if (!publicCourses) return []

    // Get courses the student is not enrolled in
    const enrolledCourseIds = new Set(currentCourses.map((c: any) => c.id))
    const availableCourses = publicCourses.filter(course => !enrolledCourseIds.has(course.id))

    // Sort by enrollment count and take top 4
    return availableCourses
      .sort((a, b) => (b._count?.enrollments || 0) - (a._count?.enrollments || 0))
      .slice(0, 4)
      .map(course => ({
        id: course.id,
        title: course.title,
        category: course.category || "General",
        popularity: Math.min(100, (course._count?.enrollments || 0) * 10), // Convert to percentage
        students: Math.floor((course._count?.enrollments || 0) / 1000) || 1, // Convert to k format
      }))
  }, [publicCourses, currentCourses])



  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 break-words">Welcome back!</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Here{'\''}s your learning progress this week</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {gamificationStats && (
              <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                <PointsDisplay
                  points={gamificationStats.totalPoints}
                  level={gamificationStats.level}
                  variant="compact"
                />
                <StreakCounter
                  currentStreak={gamificationStats.currentStreak}
                  longestStreak={gamificationStats.longestStreak}
                  variant="compact"
                />
              </div>
            )}
            <Button
              onClick={() => router.push("/courses")}
              className="gap-2 text-sm"
              size="sm"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Browse Courses</span>
              <span className="sm:hidden">Courses</span>
            </Button>
          </div>
        </div>

        {/* Personalized Roadmap Promotion */}
        <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg w-fit">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 break-words">Get Your Personalized Learning Roadmap</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">Tell us what you want to learn and get a customized path with course recommendations tailored just for you!</p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/student/recommendations")}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm w-full sm:w-auto"
                size="sm"
              >
                <span className="hidden sm:inline">Create Roadmap</span>
                <span className="sm:hidden">Get Roadmap</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {dynamicStats.map((stat, idx) => (
            <Card key={idx} className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 break-words">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg ${stat.color} w-fit`}>
                  <stat.icon className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Learning Time */}
          <Card className="lg:col-span-2 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Learning Time This Week</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={learningTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", fontSize: "12px" }} />
                <Legend />
                <Bar dataKey="hours" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Progress Distribution */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Course Progress</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dynamicProgressData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {dynamicProgressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Ongoing Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Current Courses</h3>
              {allCurrentCourses.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => router.push("/student/my-courses")}
                >
                  <span className="hidden sm:inline">
                    {allCurrentCourses.length > 3 ? `View All (${allCurrentCourses.length})` : 'All Courses'}
                  </span>
                  <span className="sm:hidden">
                    {allCurrentCourses.length > 3 ? `All (${allCurrentCourses.length})` : 'All'}
                  </span>
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading your courses...</p>
                </div>
              ) : currentCourses.length > 0 ? (
                <>
                  {allCurrentCourses.length > 3 && (
                    <div className="text-xs text-muted-foreground mb-4 p-2 bg-muted/50 rounded-lg">
                      Showing 3 of {allCurrentCourses.length} courses. Click &quot;View All&quot; to see more.
                    </div>
                  )}
                  {currentCourses.map((course: any, idx: number) => (
                    <div
                      key={idx}
                      className="border border-border rounded-lg p-3 sm:p-4 hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => {
                        const cid = (course as any).id as string | undefined
                        if (cid) window.location.href = `/course-player/${cid}`
                        else onNavigate?.("course-player")
                      }}
                    >
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-foreground text-sm sm:text-base break-words">{course.title}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">{course.instructor}</p>
                        </div>
                        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded flex-shrink-0">
                          {course.level}
                        </span>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-foreground font-medium">{course.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <CourseDownload
                          courseId={course.id}
                          courseName={course.title}
                        />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium text-foreground">No courses yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by enrolling in a course from the catalog.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => router.push("/courses")}>
                      Browse Courses
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Quick Actions</h3>
            <div className="space-y-2 sm:space-y-3">
              <Button
                className="w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-3 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => router.push("/courses")}
              >
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm sm:text-base">Browse Courses</div>
                  <div className="text-xs opacity-90 hidden sm:block">Discover new courses to learn</div>
                </div>
              </Button>
              <Button
                className="w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-3 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={() => onNavigate?.("course-player")}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm sm:text-base">Continue Learning</div>
                  <div className="text-xs opacity-90 hidden sm:block">Resume from where you left off</div>
                </div>
              </Button>
              <Button
                className="w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-3 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => onNavigate?.("ai-tutor")}
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm sm:text-base">Ask AI Tutor</div>
                  <div className="text-xs opacity-90 hidden sm:block">Get help with your doubts</div>
                </div>
              </Button>
              <Button
                className="w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                onClick={() => router.push("/student/recommendations")}
              >
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm sm:text-base">Get Learning Roadmap</div>
                  <div className="text-xs opacity-90 hidden sm:block">Personalized course recommendations</div>
                </div>
              </Button>
              <Button
                className="w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600"
                onClick={() => router.push("/quiz")}
              >
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm sm:text-base">Take AI Quiz</div>
                  <div className="text-xs opacity-90 hidden sm:block">Test your knowledge & earn points</div>
                </div>
              </Button>
              <Button
                className="w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                onClick={() => router.push("/student/revision")}
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm sm:text-base">Revision Session</div>
                  <div className="text-xs opacity-90 hidden sm:block">Explain what you learned & get AI feedback</div>
                </div>
              </Button>
              <Button
                className="w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-3 bg-muted text-muted-foreground hover:bg-muted/90"
                onClick={() => onNavigate?.("community-forum")}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-semibold text-sm sm:text-base">Community</div>
                  <div className="text-xs opacity-90 hidden sm:block">Connect with other learners</div>
                </div>
              </Button>
            </div>
          </Card>
        </div>

        {/* Gamification Dashboard */}
        {gamificationStats && (
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-semibold text-foreground break-words">Your Progress & Achievements</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/student/gamification")}
                className="text-xs sm:text-sm w-full sm:w-auto"
              >
                <span className="hidden sm:inline">View Details</span>
                <span className="sm:hidden">Details</span>
              </Button>
            </div>
            <GamificationDashboard />
          </div>
        )}

        {/* Recommendations */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Recommended For You</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/courses")}
              className="text-xs sm:text-sm w-full sm:w-auto"
            >
              <span className="hidden sm:inline">View All Courses</span>
              <span className="sm:hidden">All Courses</span>
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden animate-pulse">
                  <div className="h-24 sm:h-32 bg-muted"></div>
                  <div className="p-3 sm:p-4 space-y-2">
                    <div className="h-3 sm:h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-2 sm:h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-1 sm:h-2 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {recommendations.map((rec, idx) => (
                <div
                  key={rec.id || idx}
                  className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/courses/${rec.id}`)}
                >
                  <div className="h-24 sm:h-32 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-primary/50" />
                  </div>
                  <div className="p-3 sm:p-4">
                    <h4 className="font-semibold text-foreground text-xs sm:text-sm mb-1 line-clamp-2 break-words">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2 sm:mb-3">{rec.category}</p>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-1 bg-muted rounded-full">
                        <div className="h-1 bg-accent rounded-full" style={{ width: `${Math.min(rec.popularity, 100)}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{rec.students}k</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">No recommendations available</h3>
              <p className="text-muted-foreground mb-6">Browse our course catalog to discover new learning opportunities</p>
              <Button onClick={() => router.push("/courses")}>
                Browse All Courses
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}


