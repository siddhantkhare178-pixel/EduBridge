"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Users, BookOpen, TrendingUp, MessageSquare, Plus, Edit, Trash2, Eye, Award, Clock } from "lucide-react"

interface TeacherDashboardProps {
  onNavigate?: (page: string) => void
}

interface AnalyticsData {
  engagementData: Array<{
    day: string
    active: number
    completed: number
  }>
  assessmentData: Array<{
    name: string
    score: number
  }>
  activities: Array<{
    student: string
    action: string
    time: string
    type: string
  }>
  summary?: {
    totalStudents: number
    totalCourses: number
    activeCourses: number
    totalLessons: number
    totalForumPosts: number
  }
}

export function TeacherDashboard({ onNavigate }: TeacherDashboardProps) {

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<any[] | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/courses", { cache: "no-store" })
      if (res.ok) {
        setItems(await res.json())
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

  const loadAnalytics = async () => {
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    try {
      const res = await fetch("/api/dashboard/teacher-analytics", { cache: "no-store" })
      if (res.ok) {
        setAnalyticsData(await res.json())
      } else {
        setAnalyticsError("Failed to load analytics data")
        console.error("Failed to load analytics:", res.status)
      }
    } catch (error) {
      setAnalyticsError("An error occurred while loading analytics")
      console.error("Error loading analytics:", error)
    } finally {
      setAnalyticsLoading(false)
    }
  }



  const editCourse = async (id: string) => {
    const title = window.prompt("New title (leave blank to keep)")
    const description = window.prompt("New description (leave blank to keep)")
    const priceStr = window.prompt("New price (leave blank to keep)")
    const payload: any = {}
    if (title) payload.title = title
    if (description) payload.description = description
    if (priceStr) payload.price = Number(priceStr)
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(`Failed to update course: ${res.status}`)
      }
      await load()
    } catch (error) {
      console.error("Error updating course:", error)
      alert("Failed to update course. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const deleteCourse = async (id: string) => {
    if (!window.confirm("Delete this course?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" })
      if (!res.ok) {
        throw new Error(`Failed to delete course: ${res.status}`)
      }
      await load()
    } catch (error) {
      console.error("Error deleting course:", error)
      alert("Failed to delete course. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    loadAnalytics()
  }, [])

  const list = useMemo(
    () =>
      (items ?? []).map((c) => ({
        id: c.id as string,
        title: c.title as string,
        students: c._count?.enrollments ?? 0,
        completion: c.averageProgress ?? 0,
        status: (c.status ?? "draft") === "published" ? "Active" : "Draft",
      })),
    [items]
  )

  // Limit courses shown in dashboard to 3
  const displayedCourses = useMemo(() => list.slice(0, 3), [list])
  const hasMoreCourses = list.length > 3

  const dynamicStats = useMemo(() => {
    const totalStudents = list.reduce((sum, course) => sum + course.students, 0)
    const activeCourses = list.filter(course => course.status === "Active").length
    const totalCourses = list.length

    return [
      {
        label: "Total Students",
        value: totalStudents.toString(),
        icon: Users,
        color: "bg-primary/10 text-primary",
        change: `${totalCourses} courses`
      },
      {
        label: "Active Courses",
        value: activeCourses.toString(),
        icon: BookOpen,
        color: "bg-secondary/10 text-secondary",
        change: `${totalCourses - activeCourses} drafts`,
      },
      {
        label: "Total Courses",
        value: totalCourses.toString(),
        icon: TrendingUp,
        color: "bg-accent/10 text-accent",
        change: activeCourses > 0 ? "Published courses" : "No published yet",
      },
      {
        label: "Avg. Students",
        value: totalCourses > 0 ? Math.round(totalStudents / totalCourses).toString() : "0",
        icon: MessageSquare,
        color: "bg-primary/10 text-primary",
        change: "per course"
      },
    ]
  }, [list])

  const dynamicCourseDistribution = useMemo(() => {
    if (list.length === 0) {
      return [{ name: "No courses", value: 1, color: "var(--muted)" }]
    }

    const statusCounts = list.reduce((acc, course) => {
      acc[course.status] = (acc[course.status] || 0) + course.students
      return acc
    }, {} as Record<string, number>)

    const colors = ["var(--primary)", "var(--secondary)", "var(--accent)"]
    return Object.entries(statusCounts).map(([status, value], index) => ({
      name: status,
      value,
      color: colors[index % colors.length]
    }))
  }, [list])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2 break-words">Welcome back, Teacher!</h1>
          <p className="text-sm sm:text-base text-muted-foreground break-words">Manage your courses and monitor student progress</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {dynamicStats.map((stat, idx) => (
            <Card key={idx} className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 break-words">{stat.label}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-secondary mt-1 sm:mt-2 break-words">{stat.change}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg ${stat.color} w-fit`}>
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Courses Overview */}
          <Card className="lg:col-span-2 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h3 className="text-base sm:text-lg font-semibold text-foreground break-words">Your Courses</h3>
                {hasMoreCourses && (
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Showing 3 of {list.length} courses
                  </span>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={() => window.location.href = "/manage-course"} variant="outline" className="gap-2 flex-1 sm:flex-none text-sm">
                  <BookOpen className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Manage All</span>
                  <span className="sm:hidden">Manage</span>
                </Button>
                <Button onClick={() => window.location.href = "/create-course"} className="gap-2 flex-1 sm:flex-none text-sm">
                  <Plus className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Create Course</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {list.length > 0 ? displayedCourses.map((course, idx) => (
                <div
                  key={idx}
                  className="border border-border rounded-lg p-3 sm:p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm sm:text-base text-foreground break-words">{course.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">{course.students} students enrolled</p>
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <Button onClick={() => typeof (course as any).id === "string" ? (window.location.href = `/teacher-course-preview/${(course as any).id}`) : (window.location.href = "/course-player")} variant="ghost" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button onClick={() => typeof (course as any).id === "string" ? (window.location.href = `/manage-course/${(course as any).id}`) : editCourse((course as any).id)} variant="ghost" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation">
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button onClick={() => typeof (course as any).id === "string" && deleteCourse((course as any).id)} variant="ghost" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm text-destructive hover:text-destructive touch-manipulation">
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm">
                    <span className="text-muted-foreground">{course.completion}% avg completion</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium w-fit ${course.status === "Active" ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {course.status}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2 sm:mt-3">
                    <div className="bg-secondary h-2 rounded-full" style={{ width: `${course.completion}%` }} />
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 sm:py-12 border border-dashed rounded-lg">
                  <BookOpen className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">No courses yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 break-words px-4">Start building your first course to share knowledge with students</p>
                  <div className="flex gap-2 justify-center px-4">
                    <Button onClick={() => window.location.href = "/create-course"} className="gap-2 w-full sm:w-auto text-sm">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Create Your First Course</span>
                      <span className="sm:hidden">Create Course</span>
                    </Button>
                  </div>
                </div>
              )}
              

            </div>
          </Card>

          {/* Student Distribution */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6 break-words">
              {list.length > 0 ? "Student Distribution" : "Course Overview"}
            </h3>
            {list.length > 0 ? (
              <div className="space-y-4">
                {/* Chart and Legend Layout */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Pie Chart */}
                  <div className="flex-shrink-0">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie
                          data={dynamicCourseDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {dynamicCourseDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "var(--card)", 
                            border: "1px solid var(--border)", 
                            fontSize: "12px",
                            borderRadius: "8px"
                          }}
                          formatter={(value, name) => [`${value} students`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend and Stats */}
                  <div className="flex-1 space-y-3">
                    {dynamicCourseDistribution.map((entry, index) => {
                      const percentage = list.length > 0 ? 
                        Math.round((entry.value / list.reduce((sum, course) => sum + course.students, 0)) * 100) : 0
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">{entry.name} Courses</p>
                              <p className="text-xs text-muted-foreground">
                                {list.filter(course => course.status === entry.name).length} courses
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">{entry.value}</p>
                            <p className="text-xs text-muted-foreground">{percentage}%</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Summary Stats */}
                <div className="pt-3 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {list.reduce((sum, course) => sum + course.students, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Students</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {list.length > 0 ? Math.round(list.reduce((sum, course) => sum + course.students, 0) / list.length) : 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg per Course</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-center">
                <div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Create courses to see analytics</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground break-words">Analytics Overview</h2>
          <Button
            onClick={loadAnalytics}
            disabled={analyticsLoading}
            variant="outline"
            size="sm"
            className="gap-2 w-full sm:w-auto text-sm"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">{analyticsLoading ? "Refreshing..." : "Refresh Data"}</span>
            <span className="sm:hidden">{analyticsLoading ? "Refreshing" : "Refresh"}</span>
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Student Engagement */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 break-words">Student Engagement</h3>
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <div className="text-sm sm:text-base text-muted-foreground">Loading engagement data...</div>
              </div>
            ) : analyticsError ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-center">
                <div>
                  <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 break-words px-4">{analyticsError}</p>
                  <Button onClick={loadAnalytics} variant="outline" size="sm" className="text-sm">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : analyticsData?.engagementData ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analyticsData.engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", fontSize: "12px" }}
                    labelFormatter={(label) => `${label}`}
                    formatter={(value, name) => [
                      value,
                      name === 'active' ? 'Active Students' : 'Completed Lessons'
                    ]}
                  />
                  <Line type="monotone" dataKey="active" stroke="var(--primary)" strokeWidth={2} name="Active Students" />
                  <Line type="monotone" dataKey="completed" stroke="var(--secondary)" strokeWidth={2} name="Completed Lessons" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-center">
                <div>
                  <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-2">No engagement data available</p>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words px-4">Data will appear when students start engaging with your courses</p>
                </div>
              </div>
            )}
          </Card>

          {/* Assessment Performance */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 break-words">Course Progress Overview</h3>
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <div className="text-sm sm:text-base text-muted-foreground">Loading progress data...</div>
              </div>
            ) : analyticsError ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-center">
                <div>
                  <Award className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 break-words px-4">{analyticsError}</p>
                  <Button onClick={loadAnalytics} variant="outline" size="sm" className="text-sm">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : analyticsData?.assessmentData && analyticsData.assessmentData.length > 0 ? (
              <div className="w-full">
                {/* Mobile: Show data as cards on small screens */}
                <div className="block sm:hidden">
                  <div className="space-y-3">
                    {analyticsData.assessmentData.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Course Progress</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-accent h-2 rounded-full transition-all" 
                              style={{ width: `${Math.min(item.score, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-foreground w-10 text-right">
                            {item.score}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {analyticsData.assessmentData.length > 5 && (
                      <div className="text-center pt-2">
                        <p className="text-xs text-muted-foreground">
                          Showing 5 of {analyticsData.assessmentData.length} courses
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Desktop: Show chart on larger screens */}
                <div className="hidden sm:block">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analyticsData.assessmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis 
                        dataKey="name" 
                        stroke="var(--muted-foreground)" 
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis stroke="var(--muted-foreground)" domain={[0, 100]} fontSize={12} />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: "var(--card)", 
                          border: "1px solid var(--border)", 
                          fontSize: "12px",
                          borderRadius: "8px"
                        }}
                        formatter={(value) => [`${value}%`, 'Average Progress']}
                      />
                      <Bar dataKey="score" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-center">
                <div>
                  <Award className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-2">No progress data available</p>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words px-4">Data will appear when students make progress in your courses</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6 break-words">Recent Student Activity</h3>
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="text-sm sm:text-base text-muted-foreground">Loading recent activities...</div>
            </div>
          ) : analyticsError ? (
            <div className="text-center py-8 sm:py-12">
              <MessageSquare className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 break-words px-4">{analyticsError}</p>
              <Button onClick={loadAnalytics} variant="outline" size="sm" className="text-sm">
                Try Again
              </Button>
            </div>
          ) : analyticsData?.activities && analyticsData.activities.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {analyticsData.activities.map((activity, idx) => {
                const getActivityIcon = (type: string) => {
                  switch (type) {
                    case 'completion': return Award
                    case 'progress': return Clock
                    case 'forum': return MessageSquare
                    default: return BookOpen
                  }
                }

                const getActivityColor = (type: string) => {
                  switch (type) {
                    case 'completion': return "bg-secondary/10 text-secondary"
                    case 'progress': return "bg-primary/10 text-primary"
                    case 'forum': return "bg-accent/10 text-accent"
                    default: return "bg-primary/10 text-primary"
                  }
                }

                const ActivityIcon = getActivityIcon(activity.type)

                return (
                  <div key={idx} className="flex items-center gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-border last:border-b-0 last:pb-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                      <ActivityIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-xs sm:text-sm break-words">{activity.student}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">{activity.action}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{activity.time}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <MessageSquare className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">No recent activity</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 break-words px-4">Student activities will appear here when they engage with your courses</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}




