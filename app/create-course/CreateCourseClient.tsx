"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Eye, 
  Upload,
  FileText,
  Video,
  Link,
  GripVertical,
  Youtube,
  ExternalLink,
  StickyNote
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { VideoUpload } from "@/components/video-upload"


interface Lesson {
  id: string
  title: string
  description: string
  contentTypes: string[] // Array to store multiple selected content types
  videoType?: "upload" | "youtube" // For video content type
  textContent?: string // For text/notes content
  externalLinks?: string[] // For external links
  videoFile?: File | null // For uploaded video (deprecated)
  videoUrl?: string // For uploaded video URL from Cloudinary
  videoPublicId?: string // Cloudinary public ID for video
  youtubeUrl?: string // For YouTube URL or embed code
  order: number
}

interface Course {
  title: string
  description: string
  price: number
  status: "draft" | "published" | "archived"
  category: string
  level: string
  lessons: Lesson[]
}

export function CreateCourseClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [course, setCourse] = useState<Course>({
    title: "",
    description: "",
    price: 0,
    status: "draft",
    category: "",
    level: "beginner",
    lessons: []
  })

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [showLessonForm, setShowLessonForm] = useState(false)

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
    setCourse(prev => ({ ...prev, [field]: value }))
  }

  const addLesson = () => {
    const newLesson: Lesson = {
      id: Date.now().toString(),
      title: "",
      description: "",
      contentTypes: [],
      textContent: "",
      externalLinks: [],
      videoFile: null,
      videoUrl: "",
      videoPublicId: "",
      youtubeUrl: "",
      order: course.lessons.length + 1
    }
    setEditingLesson(newLesson)
    setShowLessonForm(true)
  }

  const saveLesson = (lesson: Lesson) => {
    if (course.lessons.find(l => l.id === lesson.id)) {
      // Update existing lesson
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map(l => l.id === lesson.id ? lesson : l)
      }))
    } else {
      // Add new lesson
      setCourse(prev => ({
        ...prev,
        lessons: [...prev.lessons, lesson]
      }))
    }
    setEditingLesson(null)
    setShowLessonForm(false)
  }

  const deleteLesson = (lessonId: string) => {
    if (confirm("Are you sure you want to delete this lesson?")) {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.filter(l => l.id !== lessonId)
      }))
    }
  }

  const editLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setShowLessonForm(true)
  }

  const saveCourse = async (status: "draft" | "published") => {
    if (!course.title.trim() || course.title.trim().length < 3) {
      alert("Please enter a course title with at least 3 characters")
      return
    }
    if (!course.description.trim() || course.description.trim().length < 10) {
      alert("Please enter a course description with at least 10 characters")
      return
    }

    setLoading(true)
    try {
      const courseData = {
        title: course.title,
        description: course.description,
        price: course.price,
        status
      }
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData)
      })

      if (res.ok) {
        const createdCourse = await res.json()
        
        // Save lessons if any
        if (course.lessons.length > 0) {
          await saveLessons(createdCourse.id)
        }

        alert(`Course ${status === "published" ? "published" : "saved as draft"} successfully!`)
        router.push("/teacher-dashboard")
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error("Course creation failed:", res.status, errorData)
        throw new Error(`Failed to create course: ${res.status} - ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error creating course:", error)
      alert("Failed to create course. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const saveLessons = async (courseId: string) => {
    for (const lesson of course.lessons) {
      const lessonData = {
        courseId,
        title: lesson.title,
        description: lesson.description,
        contentTypes: lesson.contentTypes,
        textContent: lesson.textContent,
        externalLinks: lesson.externalLinks,
        videoType: lesson.videoType,
        videoUrl: lesson.videoUrl,
        videoPublicId: lesson.videoPublicId,
        youtubeUrl: lesson.youtubeUrl,
        order: lesson.order
      }
      
      await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lessonData)
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="teacher-dashboard" onNavigate={handleNavigate} />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/teacher-dashboard")}
            className="gap-2 self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Create New Course</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Build your course with lessons, videos, and materials</p>
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
            <TabsTrigger value="preview" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
              <span className="hidden sm:inline">Preview & Publish</span>
              <span className="sm:hidden">Publish</span>
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
                    placeholder="Enter course title"
                    className="h-11"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm font-medium">Course Description *</Label>
                  <Textarea
                    id="description"
                    value={course.description}
                    onChange={(e) => handleCourseChange("description", e.target.value)}
                    placeholder="Describe what students will learn in this course"
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

                  <div className="grid gap-2">
                    <Label htmlFor="level" className="text-sm font-medium">Difficulty Level</Label>
                    <Select value={course.level} onValueChange={(value) => handleCourseChange("level", value)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                    <Select value={course.category} onValueChange={(value) => handleCourseChange("category", value)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="programming">Programming</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="data-science">Data Science</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                                  {lesson.contentTypes.includes("text") && (
                                    <Badge variant="outline" className="text-xs">
                                      <StickyNote className="w-3 h-3 mr-1" />
                                      <span className="hidden sm:inline">Text</span>
                                    </Badge>
                                  )}
                                  {lesson.contentTypes.includes("links") && (
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
                                </div>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                {lesson.description || "No description"}
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

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Course Preview</h2>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{course.title || "Course Title"}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">{course.description || "Course description will appear here"}</p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="outline">{course.level}</Badge>
                    <Badge variant="outline">{course.category || "Uncategorized"}</Badge>
                    <Badge variant="outline">{course.lessons.length} lessons</Badge>
                    <Badge variant="outline">
                      {course.price > 0 ? `₹${course.price}` : "Free"}
                    </Badge>
                  </div>
                </div>

                {course.lessons.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-sm sm:text-base">Course Content</h4>
                    <div className="space-y-2">
                      {course.lessons
                        .sort((a, b) => a.order - b.order)
                        .map((lesson, index) => (
                          <div key={lesson.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded">
                            <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">
                              {index + 1}
                            </span>
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="flex gap-1 shrink-0">
                                {lesson.contentTypes.includes("text") && <StickyNote className="w-4 h-4 text-primary" />}
                                {lesson.contentTypes.includes("links") && <ExternalLink className="w-4 h-4 text-primary" />}
                                {lesson.videoType === "upload" && <Upload className="w-4 h-4 text-primary" />}
                                {lesson.videoType === "youtube" && <Youtube className="w-4 h-4 text-primary" />}
                              </div>
                              <span className="font-medium text-sm sm:text-base truncate">{lesson.title || "Untitled Lesson"}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={() => saveCourse("draft")}
                disabled={loading}
                variant="outline"
                className="gap-2 w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                Save as Draft
              </Button>
              <Button
                onClick={() => saveCourse("published")}
                disabled={loading}
                className="gap-2 w-full sm:w-auto"
              >
                <Eye className="w-4 h-4" />
                Publish Course
              </Button>
            </div>
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
    if (formData.contentTypes.length === 0) {
      alert("Please select at least one content type")
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
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter(t => t !== type)
        : [...prev.contentTypes, type]
    }))
  }

  const addExternalLink = () => {
    if (newExternalLink.trim()) {
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
              {lesson.title ? "Edit Lesson" : "Add New Lesson"}
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
                  value={formData.description}
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
                <Label className="text-sm font-medium">Content Types * (Select multiple)</Label>
                <div className="grid gap-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="text-notes"
                      checked={formData.contentTypes.includes("text")}
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
                      checked={formData.contentTypes.includes("links")}
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
              {formData.contentTypes.includes("text") && (
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
              {formData.contentTypes.includes("links") && (
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