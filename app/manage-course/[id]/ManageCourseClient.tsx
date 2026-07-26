"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Eye, 
  FileText,
  Video,
  Link,
  GripVertical,
  Users,
  BookOpen,
  Upload,
  Youtube,
  ExternalLink,
  StickyNote
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { VideoUpload } from "@/components/video-upload"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Lesson {
  id: string
  title: string
  description?: string
  contentURL: string | null // Keep for backward compatibility
  contentTypes?: string[] // Array to store multiple selected content types
  videoType?: "upload" | "youtube" // For video content type
  textContent?: string // For text/notes content
  externalLinks?: string[] // For external links
  videoUrl?: string // For uploaded video URL from Cloudinary
  videoPublicId?: string // Cloudinary public ID for video
  youtubeUrl?: string // For YouTube URL or embed code
  order: number
}

interface Course {
  id: string
  title: string
  description: string
  price: number
  status: "draft" | "published" | "archived"
  lessons: Lesson[]
  _count: {
    lessons: number
    enrollments: number
  }
  createdBy: {
    id: string
    name: string | null
    image: string | null
  }
}

export function ManageCourseClient({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [courseId, setCourseId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [course, setCourse] = useState<Course | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [showLessonForm, setShowLessonForm] = useState(false)

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setCourseId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  const loadCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      if (res.ok) {
        const data = await res.json()
        // Ensure price is a number
        if (data.price) {
          data.price = Number(data.price)
        }
        setCourse(data)
      } else if (res.status === 403) {
        alert("You don't have permission to edit this course")
        router.push("/teacher-dashboard")
      } else {
        throw new Error("Failed to load course")
      }
    } catch (error) {
      console.error("Error loading course:", error)
      alert("Failed to load course")
      router.push("/teacher-dashboard")
    } finally {
      setLoading(false)
    }
  }, [courseId, router])

  useEffect(() => {
    if (courseId) {
      loadCourse()
    }
  }, [courseId, loadCourse])

  const handleNavigate = (page: string) => {
    switch (page) {
      case "teacher-dashboard":
        router.push("/teacher-dashboard")
        break
      default:
        router.push(`/${page}`)
    }
  }

  const handleCourseChange = (field: keyof Course, value: any) => {
    if (!course) return
    setCourse(prev => prev ? { ...prev, [field]: value } : null)
  }

  const saveCourse = async (status?: "draft" | "published" | "archived") => {
    if (!course) return

    // Validate course data
    if (!course.title.trim()) {
      alert("Please enter a course title")
      return
    }
    
    if (course.title.trim().length < 3) {
      alert("Course title must be at least 3 characters long")
      return
    }
    
    if (!course.description.trim()) {
      alert("Please enter a course description")
      return
    }
    
    if (course.description.trim().length < 10) {
      alert("Course description must be at least 10 characters long")
      return
    }
    
    const priceValue = Number(course.price)
    if (isNaN(priceValue) || priceValue < 0) {
      alert("Please enter a valid price (0 or greater)")
      return
    }

    setSaving(true)
    try {
      const updateData: any = {
        title: course.title.trim(),
        description: course.description.trim(),
        price: priceValue
      }
      
      if (status) {
        updateData.status = status
      }

      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      })

      if (res.ok) {
        const updatedCourse = await res.json()
        setCourse(prev => prev ? { ...prev, ...updatedCourse } : null)
        alert("Course updated successfully!")
      } else {
        let errorMessage = `Failed to update course (${res.status})`
        
        try {
          const errorData = await res.json()
          // Handle validation errors more user-friendly
          if (errorData.error === "Validation failed" && errorData.details) {
            errorMessage = `Validation Error: ${errorData.details}`
          } else {
            errorMessage = errorData.error || errorData.details || errorMessage
          }
        } catch (jsonError) {
          const textResponse = await res.text().catch(() => "No response body")
          errorMessage = textResponse || errorMessage
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      alert(`Failed to update course: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const addLesson = () => {
    const newLesson: Lesson = {
      id: "",
      title: "",
      description: "",
      contentURL: "",
      contentTypes: [],
      textContent: "",
      externalLinks: [],
      videoUrl: "",
      videoPublicId: "",
      youtubeUrl: "",
      videoType: undefined,
      order: (course?.lessons.length || 0) + 1
    }
    setEditingLesson(newLesson)
    setShowLessonForm(true)
  }

  const saveLesson = async (lesson: Lesson) => {
    try {
      const lessonData = {
        title: lesson.title.trim(),
        description: lesson.description?.trim() || null,
        contentTypes: lesson.contentTypes || [],
        textContent: lesson.textContent?.trim() || null,
        externalLinks: lesson.externalLinks?.filter(link => link.trim()) || [],
        videoType: lesson.videoType || null,
        videoUrl: lesson.videoUrl?.trim() || null,
        videoPublicId: lesson.videoPublicId?.trim() || null,
        youtubeUrl: lesson.youtubeUrl?.trim() || null,
        order: lesson.order,
        // Keep old field for backward compatibility
        content: lesson.textContent?.trim() || lesson.videoUrl?.trim() || lesson.youtubeUrl?.trim() || lesson.contentURL?.trim() || null
      }

      let res: Response
      
      if (lesson.id) {
        // Update existing lesson
        res = await fetch(`/api/lessons/${lesson.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lessonData)
        })
      } else {
        // Create new lesson
        res = await fetch("/api/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            ...lessonData
          })
        })
      }

      if (!res.ok) {
        let errorMessage = `Failed to ${lesson.id ? 'update' : 'create'} lesson (${res.status})`
        
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorData.details || errorMessage
        } catch (jsonError) {
          const textResponse = await res.text().catch(() => "No response body")
          errorMessage = textResponse || errorMessage
        }
        
        throw new Error(errorMessage)
      }
      
      // Reload course data
      await loadCourse()
      setEditingLesson(null)
      setShowLessonForm(false)
      alert(`Lesson ${lesson.id ? 'updated' : 'created'} successfully!`)
    } catch (error) {
      alert(`Failed to save lesson: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return

    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "DELETE"
      })
      
      if (res.ok) {
        await loadCourse()
      } else {
        throw new Error("Failed to delete lesson")
      }
    } catch (error) {
      console.error("Error deleting lesson:", error)
      alert("Failed to delete lesson")
    }
  }

  const editLesson = (lesson: Lesson) => {
    // Ensure all new fields are initialized for backward compatibility
    const normalizedLesson: Lesson = {
      ...lesson,
      description: lesson.description || "",
      contentTypes: lesson.contentTypes || [],
      textContent: lesson.textContent || "",
      externalLinks: lesson.externalLinks || [],
      videoUrl: lesson.videoUrl || "",
      videoPublicId: lesson.videoPublicId || "",
      youtubeUrl: lesson.youtubeUrl || "",
      videoType: lesson.videoType || undefined,
      contentURL: lesson.contentURL || ""
    }
    
    setEditingLesson(normalizedLesson)
    setShowLessonForm(true)
  }

  const deleteCourse = async () => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE"
      })
      
      if (res.ok) {
        alert("Course deleted successfully")
        router.push("/teacher-dashboard")
      } else {
        throw new Error("Failed to delete course")
      }
    } catch (error) {
      console.error("Error deleting course:", error)
      alert("Failed to delete course")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Course not found</h1>
          <p className="text-muted-foreground mb-4">The course you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to access it.</p>
          <Button onClick={() => router.push("/teacher-dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="teacher-dashboard" onNavigate={handleNavigate} />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/teacher-dashboard")}
              className="gap-2 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground break-words">{course.title}</h1>
              <Badge variant={course.status === "published" ? "default" : "secondary"} className="self-start">
                {course.status}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{course._count.lessons} lessons</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{course._count.enrollments} students</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/courses/${courseId}`)}
              className="gap-2 w-full sm:w-auto"
            >
              <Eye className="w-4 h-4" />
              <span className="sm:hidden">Preview</span>
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button
              variant="destructive"
              onClick={deleteCourse}
              className="gap-2 w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span className="sm:hidden">Delete</span>
              <span className="hidden sm:inline">Delete Course</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="details" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
              <span className="hidden sm:inline">Course Details</span>
              <span className="sm:hidden">Details</span>
            </TabsTrigger>
            <TabsTrigger value="lessons" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
              <span className="hidden sm:inline">Lessons & Content</span>
              <span className="sm:hidden">Lessons</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Course Details Tab */}
          <TabsContent value="details" className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Basic Information</h2>
              <div className="grid gap-4 sm:gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-sm font-medium">Course Title *</Label>
                  <Input
                    id="title"
                    value={course.title}
                    onChange={(e) => handleCourseChange("title", e.target.value)}
                    placeholder="Enter course title (minimum 3 characters)"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">Minimum 3 characters required</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm font-medium">Course Description *</Label>
                  <Textarea
                    id="description"
                    value={course.description}
                    onChange={(e) => handleCourseChange("description", e.target.value)}
                    placeholder="Describe what students will learn in this course (minimum 10 characters)"
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">Minimum 10 characters required</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="price" className="text-sm font-medium">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={course.price}
                      onChange={(e) => handleCourseChange("price", Number(e.target.value))}
                      placeholder="0"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => saveCourse()} disabled={saving} className="gap-2 w-full sm:w-auto">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold">Course Lessons</h2>
                <Button onClick={addLesson} className="gap-2 w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  <span className="sm:hidden">Add New Lesson</span>
                  <span className="hidden sm:inline">Add Lesson</span>
                </Button>
              </div>

              {course.lessons.length === 0 ? (
                <div className="text-center py-8 sm:py-12 border border-dashed rounded-lg">
                  <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-foreground">No lessons yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">Start building your course by adding lessons</p>
                  <Button onClick={addLesson} className="gap-2 w-full sm:w-auto">
                    <Plus className="w-4 h-4" />
                    Add First Lesson
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {course.lessons
                    .sort((a, b) => a.order - b.order)
                    .map((lesson, index) => (
                      <div key={lesson.id} className="border rounded-lg p-3 sm:p-4 hover:border-primary/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                              <GripVertical className="w-4 h-4 hidden sm:block" />
                              <span className="text-sm font-medium bg-muted rounded-full w-6 h-6 flex items-center justify-center">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{lesson.title || "Untitled Lesson"}</h4>
                                <div className="flex flex-wrap gap-1">
                                  {lesson.contentTypes?.includes("text") && (
                                    <Badge variant="outline" className="text-xs">
                                      <StickyNote className="w-3 h-3 mr-1" />
                                      <span className="hidden sm:inline">Text</span>
                                    </Badge>
                                  )}
                                  {lesson.contentTypes?.includes("links") && (
                                    <Badge variant="outline" className="text-xs">
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      <span className="hidden sm:inline">Links</span>
                                    </Badge>
                                  )}
                                  {lesson.videoType === "upload" && (
                                    <Badge variant="outline" className="text-xs">
                                      <Upload className="w-3 h-3 mr-1" />
                                      <span className="hidden sm:inline">Video</span>
                                    </Badge>
                                  )}
                                  {lesson.videoType === "youtube" && (
                                    <Badge variant="outline" className="text-xs">
                                      <Youtube className="w-3 h-3 mr-1" />
                                      <span className="hidden sm:inline">YouTube</span>
                                    </Badge>
                                  )}
                                  {/* Show old content type for backward compatibility */}
                                  {(!lesson.contentTypes || lesson.contentTypes.length === 0) && !lesson.videoType && lesson.contentURL && (
                                    <Badge variant="outline" className="text-xs">
                                      <FileText className="w-3 h-3 mr-1" />
                                      <span className="hidden sm:inline">Legacy</span>
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                {((lesson.contentTypes && lesson.contentTypes.length > 0) || lesson.videoUrl || lesson.youtubeUrl || lesson.contentURL) ? "Has content" : "No content"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0 self-start sm:self-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editLesson(lesson)}
                              className="gap-1 h-8 px-2 sm:h-9 sm:px-3"
                            >
                              <Edit className="w-4 h-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLesson(lesson.id)}
                              className="gap-1 text-destructive hover:text-destructive h-8 px-2 sm:h-9 sm:px-3"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Course Settings</h2>
              <div className="space-y-4 sm:space-y-6">
                <div className="grid gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm sm:text-base">Course Status</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {course.status === "draft" && "Course is in draft mode and not visible to students"}
                        {course.status === "published" && "Course is live and available to students"}
                        {course.status === "archived" && "Course is archived and no longer available"}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {course.status !== "published" && (
                        <Button onClick={() => saveCourse("published")} disabled={saving} className="w-full sm:w-auto">
                          Publish
                        </Button>
                      )}
                      {course.status !== "draft" && (
                        <Button onClick={() => saveCourse("draft")} disabled={saving} variant="outline" className="w-full sm:w-auto">
                          Draft
                        </Button>
                      )}
                      {course.status !== "archived" && (
                        <Button onClick={() => saveCourse("archived")} disabled={saving} variant="outline" className="w-full sm:w-auto">
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Lesson Form Modal */}
      {showLessonForm && editingLesson && (
        <LessonForm
          lesson={editingLesson}
          onSave={saveLesson}
          onCancel={() => {
            setEditingLesson(null)
            setShowLessonForm(false)
          }}
        />
      )}
    </div>
  )
}

interface LessonFormProps {
  lesson: Lesson
  onSave: (lesson: Lesson) => void
  onCancel: () => void
}

function LessonForm({ lesson, onSave, onCancel }: LessonFormProps) {
  const [formData, setFormData] = useState<Lesson>(lesson)
  const [newExternalLink, setNewExternalLink] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert("Please enter a lesson title")
      return
    }
    
    // Check if any content is provided
    const hasTextContent = formData.contentTypes?.includes("text") && formData.textContent?.trim()
    const hasLinks = formData.contentTypes?.includes("links") && formData.externalLinks && formData.externalLinks.length > 0
    const hasUploadVideo = formData.videoType === "upload" && formData.videoUrl?.trim()
    const hasYouTubeVideo = formData.videoType === "youtube" && formData.youtubeUrl?.trim()
    const hasLegacyContent = formData.contentURL?.trim()
    
    if (!hasTextContent && !hasLinks && !hasUploadVideo && !hasYouTubeVideo && !hasLegacyContent) {
      alert("Please add some content to the lesson (text, links, or video)")
      return
    }
    
    // Validate specific content types
    if (formData.contentTypes?.includes("text") && !formData.textContent?.trim()) {
      alert("Please add text content or uncheck the Text/Notes option")
      return
    }
    
    if (formData.contentTypes?.includes("links") && (!formData.externalLinks || formData.externalLinks.length === 0)) {
      alert("Please add at least one external link or uncheck the External Links option")
      return
    }
    
    if (formData.videoType === "upload" && !formData.videoUrl?.trim()) {
      alert("Please upload a video file or change the video type")
      return
    }
    
    if (formData.videoType === "youtube" && !formData.youtubeUrl?.trim()) {
      alert("Please add a YouTube URL or embed code")
      return
    }
    
    onSave(formData)
  }

  const handleChange = (field: keyof Lesson, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleContentType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      contentTypes: (prev.contentTypes || []).includes(type)
        ? (prev.contentTypes || []).filter(t => t !== type)
        : [...(prev.contentTypes || []), type]
    }))
  }

  const addExternalLink = () => {
    if (newExternalLink.trim()) {
      // Basic URL validation
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
      if (!urlPattern.test(newExternalLink.trim())) {
        alert("Please enter a valid URL")
        return
      }
      
      setFormData(prev => ({
        ...prev,
        externalLinks: [...(prev.externalLinks || []), newExternalLink.trim()]
      }))
      setNewExternalLink("")
    }
  }

  const removeExternalLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      externalLinks: prev.externalLinks?.filter((_, i) => i !== index) || []
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-2 sm:my-0">
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between sticky top-0 bg-card pb-2 border-b">
            <h3 className="text-base sm:text-lg font-semibold">
              {lesson.id ? "Edit Lesson" : "Add New Lesson"}
            </h3>
            <Button type="button" variant="ghost" onClick={onCancel} className="h-8 w-8 p-0">
              ×
            </Button>
          </div>

          <div className="grid gap-4 sm:gap-6">
            {/* Basic Information */}
            <div className="grid gap-3 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lesson-title" className="text-sm font-medium">Lesson Title *</Label>
                <Input
                  id="lesson-title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Enter lesson title"
                  className="h-11"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lesson-description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="lesson-description"
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe what this lesson covers"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Content Type Selection - First Dropdown */}
            <div className="grid gap-3 sm:gap-4">
              <div className="grid gap-3">
                <Label className="text-sm font-medium">Content Types (Select multiple)</Label>
                <div className="grid gap-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="text-notes"
                      checked={(formData.contentTypes || []).includes("text")}
                      onCheckedChange={() => toggleContentType("text")}
                    />
                    <Label htmlFor="text-notes" className="flex items-center gap-2 cursor-pointer text-sm">
                      <StickyNote className="w-4 h-4" />
                      Text/Notes
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="external-links"
                      checked={(formData.contentTypes || []).includes("links")}
                      onCheckedChange={() => toggleContentType("links")}
                    />
                    <Label htmlFor="external-links" className="flex items-center gap-2 cursor-pointer text-sm">
                      <ExternalLink className="w-4 h-4" />
                      External Links
                    </Label>
                  </div>
                </div>
              </div>

              {/* Video Content - Second Dropdown */}
              <div className="grid gap-3">
                <Label className="text-sm font-medium">Video Content (Optional)</Label>
                <RadioGroup
                  value={formData.videoType || ""}
                  onValueChange={(value: "upload" | "youtube") => handleChange("videoType", value)}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="upload" id="video-upload" />
                    <Label htmlFor="video-upload" className="flex items-center gap-2 cursor-pointer text-sm">
                      <Upload className="w-4 h-4" />
                      Upload Video File
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="youtube" id="youtube-link" />
                    <Label htmlFor="youtube-link" className="flex items-center gap-2 cursor-pointer text-sm">
                      <Youtube className="w-4 h-4" />
                      YouTube Link/Embed Code
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Dynamic Content Sections */}
            <div className="space-y-4 sm:space-y-6">
              {/* Text/Notes Content */}
              {(formData.contentTypes || []).includes("text") && (
                <div className="grid gap-2">
                  <Label htmlFor="text-content" className="text-sm font-medium">Text/Notes Content</Label>
                  <Textarea
                    id="text-content"
                    value={formData.textContent || ""}
                    onChange={(e) => handleChange("textContent", e.target.value)}
                    placeholder="Enter lesson content, notes, or materials"
                    rows={6}
                    className="resize-none"
                  />
                </div>
              )}

              {/* External Links */}
              {(formData.contentTypes || []).includes("links") && (
                <div className="grid gap-3">
                  <Label className="text-sm font-medium">External Links</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={newExternalLink}
                      onChange={(e) => setNewExternalLink(e.target.value)}
                      placeholder="Enter external link URL"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addExternalLink())}
                      className="h-11 flex-1"
                    />
                    <Button type="button" onClick={addExternalLink} variant="outline" className="h-11 w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Link
                    </Button>
                  </div>
                  
                  {formData.externalLinks && formData.externalLinks.length > 0 && (
                    <div className="space-y-2">
                      {formData.externalLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 sm:p-3 border rounded">
                          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="flex-1 text-sm break-all">{link}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExternalLink(index)}
                            className="shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Video Upload */}
              {formData.videoType === "upload" && (
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Upload Video File</Label>
                  <VideoUpload
                    currentVideoUrl={formData.videoUrl}
                    onUploadComplete={(videoUrl, publicId) => {
                      setFormData(prev => ({
                        ...prev,
                        videoUrl,
                        videoPublicId: publicId
                      }))
                    }}
                    onUploadError={(error) => {
                      alert(error)
                    }}
                  />
                </div>
              )}

              {/* YouTube Link/Embed */}
              {formData.videoType === "youtube" && (
                <div className="grid gap-2">
                  <Label htmlFor="youtube-url" className="text-sm font-medium">YouTube URL or Embed Code</Label>
                  <Textarea
                    id="youtube-url"
                    value={formData.youtubeUrl || ""}
                    onChange={(e) => handleChange("youtubeUrl", e.target.value)}
                    placeholder="Enter YouTube URL or embed code"
                    rows={4}
                    className="resize-none"
                  />
                </div>
              )}

              {/* Legacy Content (for backward compatibility) */}
              {(!formData.contentTypes || formData.contentTypes.length === 0) && !formData.videoType && (
                <div className="grid gap-2">
                  <Label htmlFor="legacy-content" className="text-sm font-medium">Legacy Content</Label>
                  <Textarea
                    id="legacy-content"
                    value={formData.contentURL || ""}
                    onChange={(e) => handleChange("contentURL", e.target.value)}
                    placeholder="Enter lesson content, video URL, or materials"
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    This is the old content format. Consider using the new content types above for better organization.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end sticky bottom-0 bg-card pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              Save Lesson
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}