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
  Trophy, 
  Clock, 
  Edit,
  Save,
  X
} from "lucide-react"

function pageToPath(page: string): string {
  switch (page) {
    case "landing":
      return "/"
    case "student-dashboard":
      return "/student-dashboard"
    case "profile":
      return "/student/profile"
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

export function StudentProfileClient() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    enrolledCourses: 0,
    completedCourses: 0,
    totalProgress: 0,
    joinDate: ""
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
        enrolledCourses: 0,
        completedCourses: 0,
        totalProgress: 0,
        joinDate: new Date().toLocaleDateString()
      })
      setEditForm({
        name: user.name || ""
      })
      fetchUserStats()
    }
  }, [session])

  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/user/stats")
      if (response.ok) {
        const stats = await response.json()
        setProfileData(prev => ({
          ...prev,
          enrolledCourses: stats.enrolledCourses || 0,
          completedCourses: stats.completedCourses || 0,
          totalProgress: stats.averageProgress || 0
        }))
      }
    } catch (error) {
      console.error("Failed to fetch user stats:", error)
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation currentPage="profile" onNavigate={onNavigate} />
      
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Student Profile
                </CardTitle>
                {!editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto sm:mx-0">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="text-lg">
                    {profileData.name?.charAt(0)?.toUpperCase() || "S"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4 w-full min-w-0">
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ name: e.target.value })}
                          placeholder="Enter your name"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSave}
                          disabled={loading}
                          size="sm"
                          className="gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          size="sm"
                          className="gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-center sm:text-left">
                      <h2 className="text-xl sm:text-2xl font-bold break-words">{profileData.name || "Student"}</h2>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-muted-foreground">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="break-all text-sm">{profileData.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">Joined {profileData.joinDate}</span>
                      </div>
                      <div className="flex justify-center sm:justify-start">
                        <Badge variant="secondary">Student</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold">{profileData.enrolledCourses}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Enrolled Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold">{profileData.completedCourses}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Completed Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold">{Math.round(profileData.totalProgress)}%</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Average Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <Label className="text-sm font-medium">Email Address</Label>
                  <p className="text-sm text-muted-foreground mt-1 break-all">{profileData.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Account Type</Label>
                  <p className="text-sm text-muted-foreground mt-1">Student Account</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Member Since</Label>
                  <p className="text-sm text-muted-foreground mt-1">{profileData.joinDate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="outline" className="mt-1">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}