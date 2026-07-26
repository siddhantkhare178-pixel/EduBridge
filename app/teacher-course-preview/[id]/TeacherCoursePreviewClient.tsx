"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Edit,
  Eye,
  BookOpen,
  Users,
  FileText,
  Video,
  Link as LinkIcon,
  ChevronRight,
  ChevronLeft,
  Settings,
  BarChart3
} from "lucide-react"
import { Navigation } from "@/components/navigation"

interface Lesson {
  id: string
  title: string
  description?: string | null
  contentURL: string | null // Keep for backward compatibility
  contentTypes: string[] | null
  textContent?: string | null
  externalLinks?: string[] | null
  videoType?: "upload" | "youtube" | null
  videoUrl?: string | null
  videoPublicId?: string | null
  youtubeUrl?: string | null
  order: number
  createdAt: string
  updatedAt: string
}



interface TeacherCoursePreviewClientProps {
  course: {
    id: string
    title: string
    description: string
    price: number | string
    status: string
    lessons: Lesson[]
    createdBy: {
      id: string
      name: string | null
      image: string | null
    }
    _count: {
      enrollments: number
    }
    createdAt: string
    updatedAt: string
    createdById: string
  }
}

export function TeacherCoursePreviewClient({ course }: TeacherCoursePreviewClientProps) {
  const router = useRouter()
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [activeTab, setActiveTab] = useState("overview")

  const sortedLessons = useMemo(() => {
    if (!course?.lessons) return []
    return [...course.lessons].sort((a, b) => a.order - b.order)
  }, [course.lessons])

  // Ensure course.lessons is always an array
  if (!course || !course.lessons) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Course not found</h2>
          <p className="text-muted-foreground">The course you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
        </div>
      </div>
    )
  }

  const currentLesson = sortedLessons[currentLessonIndex]

  const handleNavigate = (page: string) => {
    switch (page) {
      case "teacher-dashboard":
        router.push("/teacher-dashboard")
        break
      default:
        router.push(`/${page}`)
    }
  }

  const goToNextLesson = () => {
    if (currentLessonIndex < sortedLessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1)
    }
  }

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1)
    }
  }

  const renderLessonContent = (lesson: Lesson) => {
    const hasContent = (lesson.contentTypes && lesson.contentTypes.length > 0) || lesson.videoType || lesson.videoUrl || lesson.contentURL

    if (!hasContent) {
      return (
        <div className="text-center py-8 sm:py-12 border border-dashed rounded-lg bg-muted/20">
          <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-foreground">No content available</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">This lesson doesn&apos;t have any content yet.</p>
          <Button
            onClick={() => router.push(`/manage-course/${course.id}`)}
            variant="outline"
            className="gap-2 w-full sm:w-auto"
          >
            <Edit className="w-4 h-4" />
            Add Content
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Text Content */}
        {lesson.contentTypes && lesson.contentTypes.includes("text") && lesson.textContent && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h4 className="font-semibold text-sm sm:text-base">Text Content</h4>
            </div>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap bg-muted/50 rounded-lg p-3 sm:p-6 text-sm sm:text-base">
                {lesson.textContent}
              </div>
            </div>
          </div>
        )}

        {/* External Links */}
        {lesson.contentTypes && lesson.contentTypes.includes("links") && lesson.externalLinks && lesson.externalLinks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h4 className="font-semibold text-sm sm:text-base">External Links</h4>
            </div>
            <div className="space-y-2">
              {lesson.externalLinks.map((link, index) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-xs sm:text-sm break-all">{link}</span>
                    </div>
                    <Button asChild size="sm" variant="outline" className="w-full sm:w-auto shrink-0">
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        Open Link
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Content */}
        {lesson.videoType === "youtube" && lesson.youtubeUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h4 className="font-semibold text-sm sm:text-base">Video Content</h4>
            </div>
            {lesson.youtubeUrl.includes('<iframe') && lesson.youtubeUrl.includes('</iframe>') ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <div
                  dangerouslySetInnerHTML={{ __html: lesson.youtubeUrl }}
                  className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                />
              </div>
            ) : (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={lesson.youtubeUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title={lesson.title}
                />
              </div>
            )}
          </div>
        )}

        {lesson.videoType === "upload" && lesson.videoUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h4 className="font-semibold text-sm sm:text-base">Uploaded Video</h4>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={lesson.videoUrl}
                controls
                className="w-full h-full"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {lesson.videoType === "upload" && !lesson.videoUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h4 className="font-semibold text-sm sm:text-base">Video Upload</h4>
            </div>
            <div className="border rounded-lg p-4 sm:p-6 text-center">
              <Video className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No Video Uploaded</h3>
              <p className="text-sm sm:text-base text-muted-foreground px-4">Video upload is selected but no video has been uploaded yet.</p>
            </div>
          </div>
        )}

        {/* Backward compatibility - show old contentURL if no new content */}
        {(!lesson.contentTypes || lesson.contentTypes.length === 0) && !lesson.videoType && lesson.contentURL && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h4 className="font-semibold text-sm sm:text-base">Legacy Content</h4>
            </div>
            {lesson.contentURL.includes('<iframe') && lesson.contentURL.includes('</iframe>') ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <div
                  dangerouslySetInnerHTML={{ __html: lesson.contentURL }}
                  className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                />
              </div>
            ) : lesson.contentURL.includes('youtube.com') || lesson.contentURL.includes('youtu.be') || lesson.contentURL.includes('vimeo.com') ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={lesson.contentURL}
                  className="w-full h-full"
                  allowFullScreen
                  title={lesson.title}
                />
              </div>
            ) : lesson.contentURL.startsWith('http') ? (
              <div className="border rounded-lg p-4 sm:p-6 text-center">
                <LinkIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-primary mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">External Resource</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">This lesson links to an external resource.</p>
                <Button asChild className="w-full sm:w-auto">
                  <a href={lesson.contentURL} target="_blank" rel="noopener noreferrer">
                    Open Resource
                  </a>
                </Button>
              </div>
            ) : (
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap bg-muted/50 rounded-lg p-3 sm:p-6 text-sm sm:text-base">
                  {lesson.contentURL}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs sm:text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Teacher Note:</strong> This is how students will see the lesson content.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="teacher-dashboard" onNavigate={handleNavigate} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
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
              <Badge variant="secondary" className="gap-1 self-start">
                <Eye className="w-3 h-3" />
                <span className="text-xs">Teacher Preview</span>
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{sortedLessons.length} lessons</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{course._count.enrollments} students</span>
              </div>
              <Badge variant={course.status === "published" ? "default" : "outline"} className="text-xs">
                {course.status}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={() => router.push(`/manage-course/${course.id}`)}
              variant="outline"
              className="gap-2 w-full sm:w-auto"
            >
              <Edit className="w-4 h-4" />
              <span className="sm:hidden">Edit</span>
              <span className="hidden sm:inline">Edit Course</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
              <span className="hidden sm:inline">Course Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
              <span className="hidden sm:inline">Content Preview</span>
              <span className="sm:hidden">Content</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Course Description</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">{course.description}</p>

                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Course Structure</h3>
                <div className="space-y-2 sm:space-y-3">
                  {sortedLessons.length > 0 ? sortedLessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-2 sm:gap-3 p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setCurrentLessonIndex(index)
                        setActiveTab("content")
                      }}
                    >
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs sm:text-sm font-medium shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm sm:text-base truncate">{lesson.title}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {((lesson.contentTypes && lesson.contentTypes.length > 0) || lesson.videoUrl || lesson.youtubeUrl || lesson.contentURL) ? "Has content" : "No content yet"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  )) : (
                    <div className="text-center py-6 sm:py-8 border border-dashed rounded-lg">
                      <BookOpen className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-foreground">No lessons yet</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">Start building your course by adding lessons</p>
                      <Button
                        onClick={() => router.push(`/manage-course/${course.id}`)}
                        className="gap-2 w-full sm:w-auto"
                      >
                        <Edit className="w-4 h-4" />
                        Add Lessons
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              <div className="space-y-4 sm:space-y-6">
                <Card className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Course Stats</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={course.status === "published" ? "default" : "outline"} className="text-xs">
                        {course.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-medium text-sm">
                        {Number(course.price) > 0 ? `₹${course.price}` : "Free"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Lessons</span>
                      <span className="font-medium text-sm">{sortedLessons.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Students</span>
                      <span className="font-medium text-sm">{course._count.enrollments}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <Button
                      onClick={() => router.push(`/manage-course/${course.id}`)}
                      variant="outline"
                      className="w-full gap-2 h-10 sm:h-11"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Manage Course</span>
                    </Button>
                    <Button
                      onClick={() => setActiveTab("analytics")}
                      variant="outline"
                      className="w-full gap-2 h-10 sm:h-11"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm">View Analytics</span>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Content Preview Tab */}
          <TabsContent value="content" className="space-y-4 sm:space-y-6">
            {sortedLessons.length > 0 ? (
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
                <div className="lg:col-span-3">
                  <Card className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-semibold truncate">
                          Lesson {currentLesson?.order}: {currentLesson?.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Preview how this lesson appears to students
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousLesson}
                          disabled={currentLessonIndex === 0}
                          className="h-8 px-2 sm:h-9 sm:px-3"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1">Previous</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextLesson}
                          disabled={currentLessonIndex === sortedLessons.length - 1}
                          className="h-8 px-2 sm:h-9 sm:px-3"
                        >
                          <span className="hidden sm:inline mr-1">Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {currentLesson && renderLessonContent(currentLesson)}

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Lesson {currentLessonIndex + 1} of {sortedLessons.length}
                      </div>
                      <Button
                        onClick={() => router.push(`/manage-course/${course.id}`)}
                        variant="outline"
                        className="gap-2 w-full sm:w-auto"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm">Edit This Lesson</span>
                      </Button>
                    </div>
                  </Card>
                </div>

                <div className="lg:col-span-1 order-first lg:order-last">
                  <Card className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">All Lessons</h3>
                    <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                      {sortedLessons.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors ${index === currentLessonIndex
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                          onClick={() => setCurrentLessonIndex(index)}
                        >
                          <div className="text-xs sm:text-sm font-medium text-foreground truncate">
                            {lesson.order}. {lesson.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {((lesson.contentTypes && lesson.contentTypes.length > 0) || lesson.videoUrl || lesson.youtubeUrl || lesson.contentURL) ? "Has content" : "No content"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="p-6 sm:p-12 text-center">
                <BookOpen className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">No lessons to preview</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">Add lessons to your course to see how they&apos;ll appear to students</p>
                <Button
                  onClick={() => router.push(`/manage-course/${course.id}`)}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Edit className="w-4 h-4" />
                  Add Lessons
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Course Analytics</h3>
              <div className="text-center py-8 sm:py-12">
                <BarChart3 className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-sm sm:text-base text-muted-foreground px-4">
                  Detailed analytics about student engagement, progress, and performance will be available here.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}