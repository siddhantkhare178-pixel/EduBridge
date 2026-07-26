"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Calendar,
  BookOpen,
  Users,
  DollarSign,
  Edit,
  Save,
  X,
  GraduationCap,
  Star
} from "lucide-react"

function pageToPath(page: string): string {
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
    default:
      return "/"
  }
}

export function TeacherProfileClient() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    joinDate: "",
    publishedCourses: 0
  })
  const [editForm, setEditForm] = useState({
    name: ""
  })

  const onNavigate = (page: string) => router.push(pageToPath(page))

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        totalCourses: 0,
        totalStudents: 0,
        totalRevenue: 0,
        joinDate: new Date().toLocaleDateString(),
        publishedCourses: 0
      })
      setEditForm({
        name: user.name || ""
      })
      fetchTeacherStats()
    }
  }, [session])

  const fetchTeacherStats = async () => {
    try {
      const response = await fetch("/api/teacher/stats")
      if (response.ok) {
        const stats = await response.json()
        setProfileData(prev => ({
          ...prev,
          totalCourses: stats.totalCourses || 0,
          publishedCourses: stats.publishedCourses || 0,
          totalStudents: stats.totalStudents || 0,
          totalRevenue: stats.totalRevenue || 0
        }))
      }
    } catch (error) {
      console.error("Failed to fetch teacher stats:", error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name })
      })

      if (response.ok) {
        setProfileData(prev => ({ ...prev, name: editForm.name }))
        await update({ name: editForm.name })
        setEditing(false)
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditForm({ name: profileData.name })
    setEditing(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="profile" onNavigate={onNavigate} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <GraduationCap className="w-5 h-5" />
                  Teacher Profile
                </CardTitle>
                {!editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="text-base sm:text-lg">
                    {profileData.name?.charAt(0)?.toUpperCase() || "T"}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-3 sm:space-y-4 w-full">
                  {editing ? (
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ name: e.target.value })}
                          placeholder="Enter your name"
                          className="h-11 mt-1"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={handleSave}
                          disabled={loading}
                          size="sm"
                          className="gap-2 w-full sm:w-auto"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          size="sm"
                          className="gap-2 w-full sm:w-auto"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      <h2 className="text-xl sm:text-2xl font-bold break-words">{profileData.name || "Teacher"}</h2>
                      <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="break-all">{profileData.email}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {profileData.joinDate}</span>
                      </div>
                      <div className="flex justify-center">
                        <Badge variant="secondary">Teacher</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teaching Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xl sm:text-2xl font-bold">{profileData.totalCourses}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                  <div className="p-2 bg-green-100 rounded-lg shrink-0">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xl sm:text-2xl font-bold">{profileData.publishedCourses}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xl sm:text-2xl font-bold">{profileData.totalStudents}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg shrink-0">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xl sm:text-2xl font-bold">₹{profileData.totalRevenue}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Information */}
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Email Address</Label>
                  <p className="text-sm text-muted-foreground break-all">{profileData.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Account Type</Label>
                  <p className="text-sm text-muted-foreground">Teacher Account</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Member Since</Label>
                  <p className="text-sm text-muted-foreground">{profileData.joinDate}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Status</Label>
                  <div>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/teacher-dashboard")}
                  className="gap-2 w-full sm:w-auto"
                >
                  <BookOpen className="w-4 h-4" />
                  View Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/teacher-dashboard")}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Users className="w-4 h-4" />
                  Manage Courses
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}