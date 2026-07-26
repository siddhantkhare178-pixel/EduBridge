"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Filter, ArrowLeft, Play, Award, Clock, TrendingUp } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { CourseDownload } from "@/components/course-download"

interface Course {
  id: string
  title: string
  instructor: string
  level: string
  progress: number
  enrolledAt: string
  lastAccessed?: string
  status: 'active' | 'completed' | 'paused'
}

export function MyCoursesClient() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("recent")

  useEffect(() => {
    const loadCourses = async () => {
      try {
        // Load enrollments
        const enrollmentsRes = await fetch("/api/enrollments", { cache: "no-store" })
        if (enrollmentsRes.ok) {
          const enrollmentsData = await enrollmentsRes.json()
          
          // Load dashboard stats for progress
          const statsRes = await fetch("/api/dashboard/stats", { cache: "no-store" })
          let progressData = []
          if (statsRes.ok) {
            const statsData = await statsRes.json()
            progressData = statsData.courseProgresses || []
          }

          // Transform data
          const transformedCourses = enrollmentsData.map((enrollment: any) => {
            const progress = progressData.find((p: any) => p.courseId === enrollment.courseId)
            const progressPercent = progress?.progress || 0
            
            return {
              id: enrollment.courseId,
              title: enrollment.course?.title || "Course",
              instructor: `by ${enrollment.course?.createdBy?.name || "Instructor"}`,
              level: enrollment.course?.price && Number(enrollment.course.price) > 0 ? "Paid" : "Free",
              progress: progressPercent,
              enrolledAt: enrollment.createdAt,
              status: progressPercent >= 100 ? 'completed' : progressPercent > 0 ? 'active' : 'active'
            }
          })

          setCourses(transformedCourses)
        }
      } catch (error) {
        console.error("Error loading courses:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

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
      default:
        router.push(`/${page}`)
    }
  }

  // Filter and sort courses
  const filteredCourses = courses
    .filter(course => {
      const matchesSearch = !searchQuery || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = filterStatus === "all" || course.status === filterStatus
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "progress":
          return b.progress - a.progress
        case "title":
          return a.title.localeCompare(b.title)
        case "enrolled":
          return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()
        case "recent":
        default:
          return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()
      }
    })

  // Calculate stats
  const stats = {
    total: courses.length,
    completed: courses.filter(c => c.status === 'completed').length,
    inProgress: courses.filter(c => c.status === 'active' && c.progress > 0).length,
    avgProgress: courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length) : 0
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="student-dashboard" onNavigate={handleNavigate} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">My Courses</h1>
              <p className="text-muted-foreground">
                Manage and track your learning progress across all enrolled courses
              </p>
            </div>
            <Button onClick={() => router.push("/courses")} className="gap-2">
              <BookOpen className="h-4 w-4" />
              Browse More Courses
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 text-green-600 rounded-lg">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                <Play className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 text-orange-600 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.avgProgress}%</p>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search courses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Enrolled</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="enrolled">Enrollment Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Results Summary */}
        <div className="mb-6 text-sm text-muted-foreground">
          Showing {filteredCourses.length} of {courses.length} courses
          {searchQuery && ` for "${searchQuery}"`}
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-40 bg-muted rounded-lg mb-4"></div>
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </Card>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-primary/50" />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                      {course.title}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                      course.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : course.progress > 0
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {course.status === 'completed' ? 'Completed' : course.progress > 0 ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {course.instructor}
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground font-medium">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`rounded-full h-2 transition-all ${
                          course.status === 'completed' ? 'bg-green-500' : 'bg-primary'
                        }`}
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 gap-2"
                        onClick={() => router.push(`/course-player/${course.id}`)}
                      >
                        <Play className="h-4 w-4" />
                        {course.progress > 0 ? 'Continue' : 'Start'}
                      </Button>
                    </div>
                    
                    <CourseDownload 
                      courseId={course.id}
                      courseName={course.title}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed rounded-lg">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No courses found</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              {searchQuery 
                ? 'Try adjusting your search or filter criteria'
                : 'You haven\'t enrolled in any courses yet'}
            </p>
            {searchQuery ? (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            ) : (
              <Button onClick={() => router.push('/courses')}>
                Browse Courses
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}