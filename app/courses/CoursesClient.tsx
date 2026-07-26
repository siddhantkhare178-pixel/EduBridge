"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, Search, Filter, ArrowRight, X, RefreshCw, ChevronDown, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navigation } from "@/components/navigation"
import { CourseDownload } from "@/components/course-download"


export function CoursesClient() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    priceType: "all", // free, premium, all
    sort: "newest" // newest, oldest, title
  })
  const [showFilters, setShowFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close dropdowns when clicking outside or on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null)
      }
    }

    if (openDropdown) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openDropdown])


  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)

        // Fetch courses
        const coursesRes = await fetch("/api/courses/public")
        if (!coursesRes.ok) {
          throw new Error(`Failed to fetch courses: ${coursesRes.status}`)
        }
        const coursesData = await coursesRes.json()

        if (coursesData.error) {
          throw new Error(coursesData.error)
        }

        setCourses(Array.isArray(coursesData) ? coursesData : [])
        console.log("Fetched courses:", coursesData.length, "courses")
        console.log("Sample course:", coursesData[0])

        // Fetch user enrollments to check which courses are enrolled
        const enrollmentsRes = await fetch("/api/enrollments")
        if (enrollmentsRes.ok) {
          const enrollmentsData = await enrollmentsRes.json()
          setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : [])
          console.log("Fetched enrollments:", enrollmentsData.length, "enrollments")
        } else {
          console.warn("Failed to fetch enrollments, continuing without enrollment data")
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        setError(error instanceof Error ? error.message : "Failed to load courses")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredCourses = courses
    .filter(course => {
      // Search filter
      const matchesSearch = !searchQuery ||
        course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase())

      // Price filter
      const matchesPrice = filters.priceType === "all" ||
        (filters.priceType === "free" && (!course.price || Number(course.price) === 0)) ||
        (filters.priceType === "premium" && course.price && Number(course.price) > 0)

      return matchesSearch && matchesPrice
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  // Debug logging
  console.log("Filter state:", { searchQuery, filters, totalCourses: courses.length, filteredCount: filteredCourses.length })

  // Custom mobile dropdown component
  const MobileDropdown = ({
    value,
    onChange,
    options,
    placeholder,
    dropdownKey
  }: {
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    placeholder?: string
    dropdownKey: string
  }) => {
    const isOpen = openDropdown === dropdownKey
    const selectedOption = options.find(opt => opt.value === value)

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
          className="w-full h-11 px-4 py-2 text-base border-2 border-input bg-background rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors flex items-center justify-between text-left"
        >
          <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setOpenDropdown(null)}
            />

            {/* Dropdown */}
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border-2 border-input rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpenDropdown(null)
                  }}
                  className="w-full px-4 py-3 text-left text-base hover:bg-muted/50 transition-colors flex items-center justify-between first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="text-foreground">{option.label}</span>
                  {value === option.value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  const isEnrolledInCourse = (courseId: string) => {
    return enrollments.some(enrollment => enrollment.courseId === courseId)
  }

  const handleNavigate = (page: string) => {
    switch (page) {
      case "landing":
        router.push("/student-dashboard")
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="courses" onNavigate={handleNavigate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Explore Our Courses</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover a wide range of courses taught by industry experts
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search courses..."
                className={`pl-10 ${isMobile ? 'h-11 text-base' : ''} transition-colors`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              className={`gap-2 min-w-[100px] ${isMobile ? 'h-11 px-6' : ''} transition-all duration-200 ${showFilters ? 'shadow-md' : ''}`}
              onClick={() => {
                try {
                  setShowFilters(!showFilters)
                } catch (error) {
                  console.error("Error toggling filters:", error)
                }
              }}
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Filters'}
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-4 md:p-6 border rounded-lg bg-card shadow-sm">
            {/* Mobile: Stack vertically with better spacing */}
            <div className="space-y-5 md:space-y-0 md:flex md:gap-6">
              <div className="flex-1">
                <label className="text-sm font-semibold mb-3 block text-foreground">
                  Price Type
                </label>
                {isMobile ? (
                  <MobileDropdown
                    value={filters.priceType}
                    onChange={(value) => setFilters(prev => ({ ...prev, priceType: value }))}
                    options={[
                      { value: "all", label: "All courses" },
                      { value: "free", label: "Free courses" },
                      { value: "premium", label: "Premium courses" }
                    ]}
                    placeholder="Select price type"
                    dropdownKey="priceType"
                  />
                ) : (
                  <Select
                    value={filters.priceType}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, priceType: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All courses" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-50">
                      <SelectItem value="all">All courses</SelectItem>
                      <SelectItem value="free">Free courses</SelectItem>
                      <SelectItem value="premium">Premium courses</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex-1">
                <label className="text-sm font-semibold mb-3 block text-foreground">
                  Sort by
                </label>
                {isMobile ? (
                  <MobileDropdown
                    value={filters.sort}
                    onChange={(value) => setFilters(prev => ({ ...prev, sort: value }))}
                    options={[
                      { value: "newest", label: "Newest first" },
                      { value: "oldest", label: "Oldest first" },
                      { value: "title", label: "Title A-Z" }
                    ]}
                    placeholder="Select sort order"
                    dropdownKey="sort"
                  />
                ) : (
                  <Select
                    value={filters.sort}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, sort: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-50">
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="title">Title A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Clear button - full width on mobile, positioned better */}
              <div className="md:flex md:items-end">
                <Button
                  variant="outline"
                  size={isMobile ? "default" : "sm"}
                  onClick={() => {
                    setFilters({ priceType: "all", sort: "newest" })
                    setSearchQuery("")
                  }}
                  className="gap-2 w-full md:w-auto h-11 md:h-auto border-2 hover:bg-muted/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Clear all
                </Button>
              </div>
            </div>

            {/* Mobile: Add a subtle divider and filter count */}
            {isMobile && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="text-xs text-muted-foreground text-center">
                  {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Summary */}
        {!loading && !error && (
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Showing {filteredCourses.length} of {courses.length} courses
              {searchQuery && ` for "${searchQuery}"`}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16 border border-dashed border-destructive/50 rounded-lg bg-destructive/5">
            <div className="mx-auto h-12 w-12 text-destructive mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-foreground">Error loading courses</h3>
            <p className="text-muted-foreground mt-2 mb-6">{error}</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
        )}

        {/* Courses Grid */}
        {!error && loading ? (
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
        ) : !error && filteredCourses.length > 0 ? (
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
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded whitespace-nowrap">
                      {course.price && Number(course.price) > 0 ? `₹${course.price}` : 'Free'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {course.description || 'No description available'}
                  </p>
                  <div className="text-xs text-muted-foreground mb-4">
                    By {course.createdBy?.name || 'Unknown'}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{course._count?.lessons || 0} lessons</span>
                        <span>{course._count?.enrollments || 0} students</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => router.push(`/courses/${course.id}`)}
                      >
                        View Course
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    {isEnrolledInCourse(course.id) && (
                      <CourseDownload
                        courseId={course.id}
                        courseName={course.title}
                      />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : !error && (
          <div className="text-center py-16 border border-dashed rounded-lg">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No courses found</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filter criteria'
                : 'No courses are currently available'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}