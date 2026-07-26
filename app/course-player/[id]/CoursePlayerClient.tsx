"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  CheckCircle, 
  Circle, 
  BookOpen, 
  User,
  FileText,
  Link as LinkIcon,
  ChevronRight,
  ChevronLeft,
  Download,
  Wifi,
  WifiOff,
  Clock
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { CourseDownload } from "@/components/course-download"
import { LearningTimeTracker } from "@/components/learning-time-tracker"
import { useOffline } from "@/hooks/use-offline"
import { useOfflineProgress } from "@/hooks/use-offline-progress"

interface Lesson {
  id: string
  title: string
  description: string | null
  contentURL: string | null // Keep for backward compatibility
  contentTypes: string[]
  textContent: string | null
  externalLinks: string[]
  videoType: string | null
  videoUrl: string | null
  youtubeUrl: string | null
  order: number
}



interface ProgressRow {
  lessonId: string
  order: number
  progress: { 
    id: string
    percent: number
    completedAt?: string | null 
  } | null
}

interface CoursePlayerClientProps {
  course: any // Using any for now to avoid type conflicts with Prisma return type
}

export function CoursePlayerClient({ course }: CoursePlayerClientProps) {
  const router = useRouter()
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [progressData, setProgressData] = useState<ProgressRow[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("content")
  const { isOnline } = useOffline()
  
  // Get user ID from session (you may need to adjust this based on your auth setup)
  const [userId, setUserId] = useState<string>("")
  
  useEffect(() => {
    // Get user ID from session or auth context
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        if (session?.user?.id) {
          setUserId(session.user.id)
        }
      })
      .catch(console.error)
  }, [])
  
  const offlineProgress = useOfflineProgress(userId, course.id)

  const sortedLessons = useMemo(() => 
    [...course.lessons].sort((a, b) => a.order - b.order),
    [course.lessons]
  )

  const currentLesson = sortedLessons[currentLessonIndex]

  const loadProgress = useCallback(async () => {
    setLoading(true)
    try {
      let progressData = []
      
      // Try to load offline progress first if user is available
      if (userId) {
        try {
          const offlineProgressData = await offlineProgress.progress
          if (offlineProgressData && offlineProgressData.length > 0) {
            // Convert offline progress to the expected format
            progressData = offlineProgressData.map(p => ({
              lessonId: p.lessonId,
              order: 0, // Will be set based on lesson order
              progress: {
                id: p.id,
                percent: p.progress,
                completedAt: p.completed ? p.lastAccessed.toISOString() : null
              }
            }))
          }
        } catch (offlineError) {
          console.warn("Failed to load offline progress:", offlineError)
        }
      }
      
      // If online, try to load fresh progress data
      if (isOnline) {
        try {
          const res = await fetch(`/api/progress?courseId=${encodeURIComponent(course.id)}`)
          if (res.ok) {
            const onlineData = await res.json()
            progressData = onlineData
          }
        } catch (onlineError) {
          console.warn("Failed to load online progress, using offline data:", onlineError)
        }
      }
      
      setProgressData(progressData)
    } catch (error) {
      console.error("Error loading progress:", error)
    } finally {
      setLoading(false)
    }
  }, [course.id, userId, isOnline, offlineProgress.progress])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  const markLessonComplete = async (lessonId: string) => {
    setLoading(true)
    try {
      // Try online first, then fallback to offline
      if (isOnline) {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            lessonId, 
            percent: 100, 
            completedAt: new Date().toISOString() 
          }),
        })
      }
      
      // Also update offline progress if user ID is available
      if (userId) {
        await offlineProgress.markLessonComplete(lessonId, 0) // 0 time spent for now
      }
      
      await loadProgress()
    } catch (error) {
      console.error("Error marking lesson complete:", error)
      
      // If online request fails but we have userId, still try offline
      if (userId && !isOnline) {
        try {
          await offlineProgress.markLessonComplete(lessonId, 0)
          await loadProgress()
        } catch (offlineError) {
          console.error("Offline progress update also failed:", offlineError)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const getLessonProgress = useCallback((lessonId: string) => {
    const progress = progressData.find(p => p.lessonId === lessonId)
    return progress?.progress?.percent || 0
  }, [progressData])

  const isLessonCompleted = useCallback((lessonId: string) => {
    return getLessonProgress(lessonId) >= 100
  }, [getLessonProgress])

  const overallProgress = useMemo(() => {
    if (sortedLessons.length === 0) return 0
    const totalProgress = sortedLessons.reduce((sum, lesson) => 
      sum + getLessonProgress(lesson.id), 0
    )
    return Math.round(totalProgress / sortedLessons.length)
  }, [sortedLessons, getLessonProgress])

  const completedLessons = useMemo(() => 
    sortedLessons.filter(lesson => isLessonCompleted(lesson.id)).length,
    [sortedLessons, isLessonCompleted]
  )

  const handleNavigate = (page: string) => {
    switch (page) {
      case "landing":
        router.push("/student-dashboard") // For logged-in users, home should go to dashboard
        break
      case "student-dashboard":
        router.push("/student-dashboard")
        break
      case "courses":
        router.push("/courses")
        break
      case "course-player":
        router.push("/course-player")
        break
      case "ai-tutor":
        router.push("/ai-tutor")
        break
      case "teacher-dashboard":
        router.push("/teacher-dashboard")
        break
      case "community-forum":
        router.push("/community-forum")
        break
      default:
        router.push("/student-dashboard") // Default to dashboard for logged-in users
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
    const hasContent = lesson.contentTypes?.length > 0 || lesson.contentURL
    
    if (!hasContent) {
      return (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No content available</h3>
          <p className="text-muted-foreground">This lesson doesn&apos;t have any content yet.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Lesson Description */}
        {lesson.description && (
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-sm sm:text-base text-muted-foreground break-words">{lesson.description}</p>
          </div>
        )}

        {/* Video Content */}
        {(lesson.contentTypes?.includes('video') || lesson.videoUrl || lesson.youtubeUrl) && (
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-base sm:text-lg font-semibold">Video</h4>
            {lesson.youtubeUrl ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {lesson.youtubeUrl.includes('<iframe') ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: lesson.youtubeUrl }}
                    className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                  />
                ) : (
                  <iframe
                    src={lesson.youtubeUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title={lesson.title}
                  />
                )}
              </div>
            ) : lesson.videoUrl ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={lesson.videoUrl}
                  controls
                  className="w-full h-full"
                  title={lesson.title}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : null}
          </div>
        )}

        {/* Text Content */}
        {(lesson.contentTypes?.includes('text') || lesson.textContent) && (
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-base sm:text-lg font-semibold">Notes</h4>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap bg-muted/50 rounded-lg p-3 sm:p-6 text-sm sm:text-base break-words">
                {lesson.textContent}
              </div>
            </div>
          </div>
        )}

        {/* External Links */}
        {(lesson.contentTypes?.includes('links') || lesson.externalLinks?.length > 0) && (
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-base sm:text-lg font-semibold">Resources</h4>
            <div className="space-y-2">
              {lesson.externalLinks?.map((link, index) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium break-words">External Resource {index + 1}</span>
                  </div>
                  <Button asChild size="sm" className="w-full sm:w-auto text-xs">
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <span className="hidden sm:inline">Open Link</span>
                      <span className="sm:hidden">Open</span>
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Backward compatibility with old contentURL */}
        {lesson.contentURL && !lesson.contentTypes?.length && (
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-base sm:text-lg font-semibold">Content</h4>
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
                <p className="text-sm sm:text-base text-muted-foreground mb-4 px-2">This lesson links to an external resource.</p>
                <Button asChild size="sm" className="text-sm">
                  <a href={lesson.contentURL} target="_blank" rel="noopener noreferrer">
                    Open Resource
                  </a>
                </Button>
              </div>
            ) : (
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap bg-muted/50 rounded-lg p-3 sm:p-6 text-sm sm:text-base break-words">
                  {lesson.contentURL}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation currentPage="courses" onNavigate={handleNavigate} />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/student-dashboard")}
            className="gap-2 text-sm w-fit"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground break-words">{course.title}</h1>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{course.createdBy.name || "Instructor"}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{sortedLessons.length} lessons</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{completedLessons}/{sortedLessons.length} completed</span>
              </div>
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0" />
                )}
                <span>{isOnline ? "Online" : "Offline"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <CourseDownload 
              courseId={course.id}
              courseName={course.title}
            />
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold">Course Progress</h3>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">
                {completedLessons} of {sortedLessons.length} lessons completed
                {!isOnline && " (Offline tracking)"}
              </p>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-primary">{overallProgress}%</div>
              <div className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center sm:justify-end gap-1">
                <span>Complete</span>
                {!isOnline && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-2 w-2 mr-1" />
                    Will sync
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 sm:h-3">
            <div 
              className="bg-primary h-2 sm:h-3 rounded-full transition-all duration-300" 
              style={{ width: `${overallProgress}%` }} 
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Lesson Content */}
          <div className="lg:col-span-3">
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold break-words">
                    Lesson {currentLesson?.order}: {currentLesson?.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    {isLessonCompleted(currentLesson?.id) ? (
                      <Badge variant="default" className="gap-1 text-xs">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Circle className="w-3 h-3" />
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousLesson}
                    disabled={currentLessonIndex === 0}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextLesson}
                    disabled={currentLessonIndex === sortedLessons.length - 1}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="content" className="flex-1 sm:flex-none text-sm">Content</TabsTrigger>
                  <TabsTrigger value="notes" className="flex-1 sm:flex-none text-sm">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4 sm:space-y-6">
                  {currentLesson && renderLessonContent(currentLesson)}
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 sm:pt-6 border-t gap-3">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Lesson {currentLessonIndex + 1} of {sortedLessons.length}
                    </div>
                    {!isLessonCompleted(currentLesson?.id) && (
                      <Button 
                        onClick={() => markLessonComplete(currentLesson.id)}
                        disabled={loading}
                        className="gap-2 w-full sm:w-auto text-sm"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Mark as Complete</span>
                        <span className="sm:hidden">Complete</span>
                        {!isOnline && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            Offline
                          </Badge>
                        )}
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4 sm:space-y-6">
                  <div className="text-center py-8 sm:py-12 border border-dashed rounded-lg">
                    <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-foreground">Notes feature coming soon</h3>
                    <p className="text-sm sm:text-base text-muted-foreground px-4">Take notes while learning to enhance your experience.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Lesson Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Course Lessons</h3>
              <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                {sortedLessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                      index === currentLessonIndex 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setCurrentLessonIndex(index)}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex-shrink-0">
                        {isLessonCompleted(lesson.id) ? (
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        ) : (
                          <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-foreground truncate">
                          {lesson.order}. {lesson.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isLessonCompleted(lesson.id) ? "Completed" : "Not started"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Learning Time Tracker */}
            {currentLesson && (
              <LearningTimeTracker
                lessonId={currentLesson.id}
                courseId={course.id}
                autoStart={true}
                showControls={true}
                className="mb-4 sm:mb-6"
              />
            )}

            {/* Course Info */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Course Info</h3>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Instructor</span>
                  <span className="font-medium text-right break-words">{course.createdBy.name || "Unknown"}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Total Lessons</span>
                  <span className="font-medium">{sortedLessons.length}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Students</span>
                  <span className="font-medium">{course._count.enrollments}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">
                    {Number(course.price) > 0 ? `₹${course.price}` : "Free"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}