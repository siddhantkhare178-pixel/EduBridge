"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  BookOpen,
  Users,
  Edit,
  Trash2,
  Eye,
  Plus,
  Search,
  MoreVertical,
  TrendingUp,
  DollarSign,
  ArrowLeft
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Navigation } from "@/components/navigation"

interface Course {
  id: string
  title: string
  description: string
  price: number
  status: string
  createdAt: string
  updatedAt: string
  _count: {
    lessons: number
    enrollments: number
  }
  averageProgress: number
  createdBy: {
    id: string
    name: string
    image: string
  }
}

export function ManageCoursesClient() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const loadCourses = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/courses", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setCourses(data)
      } else {
        console.error("Failed to load courses:", res.status)
        alert("Failed to load courses. Please try again.")
      }
    } catch (error) {
      console.error("Error loading courses:", error)
      alert("An error occurred while loading courses.")
    } finally {
      setLoading(false)
    }
  }

  const deleteCourse = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return

    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" })
      if (!res.ok) {
        throw new Error(`Failed to delete course: ${res.status}`)
      }
      await loadCourses()
    } catch (error) {
      console.error("Error deleting course:", error)
      alert("Failed to delete course. Please try again.")
    }
  }

  const duplicateCourse = async (course: Course) => {
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${course.title} (Copy)`,
          description: course.description,
          price: course.price,
          status: "draft"
        }),
      })
      if (!res.ok) {
        throw new Error(`Failed to duplicate course: ${res.status}`)
      }
      await loadCourses()
    } catch (error) {
      console.error("Error duplicating course:", error)
      alert("Failed to duplicate course. Please try again.")
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || course.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `₹${price.toLocaleString()}`
  }

  const handleNavigate = (page: string) => {
    switch (page) {
      case "student-dashboard":
        router.push("/student")
        break
      case "teacher-dashboard":
        router.push("/teacher")
        break
      case "landing":
        router.push("/")
        break
      case "announcements":
        router.push("/announcements")
        break
      case "quiz":
        router.push("/quiz")
        break
      case "profile":
        router.push("/teacher/profile")
        break
      default:
        router.push("/")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="manage-course" onNavigate={handleNavigate} />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/teacher-dashboard")}
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-words">Manage Courses</h1>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">View and manage all your courses</p>
            </div>
          </div>
          <Button onClick={() => router.push("/create-course")} className="gap-2 w-full sm:w-auto text-sm">
            <Plus className="w-4 h-4" />
            <span className="sm:hidden">Create Course</span>
            <span className="hidden sm:inline">Create New Course</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-lg w-fit">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{courses.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">Total Courses</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-lg w-fit">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                  {courses.filter(c => c.status === "published").length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">Published</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg w-fit">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                  {courses.reduce((sum, course) => sum + course._count.enrollments, 0)}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">Total Students</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6 col-span-2 lg:col-span-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900 rounded-lg w-fit">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold break-all">
                  ₹{courses.reduce((sum, course) => sum + (course.price * course._count.enrollments), 0).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">Total Revenue</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="text-xs sm:text-sm"
            >
              All
            </Button>
            <Button
              variant={statusFilter === "published" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("published")}
              className="text-xs sm:text-sm"
            >
              Published
            </Button>
            <Button
              variant={statusFilter === "draft" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("draft")}
              className="text-xs sm:text-sm"
            >
              Draft
            </Button>
            <Button
              variant={statusFilter === "archived" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("archived")}
              className="text-xs sm:text-sm"
            >
              Archived
            </Button>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="text-sm sm:text-base text-muted-foreground">Loading courses...</div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <BookOpen className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 break-words">
              {courses.length === 0 ? "No courses yet" : "No courses found"}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 break-words">
              {courses.length === 0
                ? "Start building your first course to share knowledge with students"
                : "Try adjusting your search or filter criteria"
              }
            </p>
            {courses.length === 0 && (
              <Button onClick={() => router.push("/create-course")} className="gap-2 w-full sm:w-auto text-sm">
                <Plus className="w-4 h-4" />
                <span className="sm:hidden">Create Course</span>
                <span className="hidden sm:inline">Create Your First Course</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold text-base sm:text-lg text-foreground mb-2 line-clamp-2 break-words">
                        {course.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3 break-words">
                        {course.description}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/teacher-course-preview/${course.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/manage-course/${course.id}`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateCourse(course)}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteCourse(course.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium break-all">{formatPrice(course.price)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Lessons</span>
                      <span className="font-medium">{course._count.lessons}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Students</span>
                      <span className="font-medium">{course._count.enrollments}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Avg. Progress</span>
                      <span className="font-medium">{course.averageProgress}%</span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">{formatDate(course.createdAt)}</span>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/teacher-course-preview/${course.id}`)}
                        className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Preview</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/manage-course/${course.id}`)}
                        className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
