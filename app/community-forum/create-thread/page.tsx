"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Wifi, WifiOff, Clock } from "lucide-react"
import { useOffline } from "@/hooks/use-offline"
import { offlineManager } from "@/lib/offline-manager"
import { toast } from "sonner"

function pageToPath(page: string): string {
  switch (page) {
    case "landing":
      return "/"
    case "student-dashboard":
      return "/student-dashboard"
    case "course-player":
      return "/course-player"
    case "ai-tutor":
      return "/ai-tutor"
    case "teacher-dashboard":
      return "/teacher-dashboard"
    case "community-forum":
      return "/community-forum"
    case "create-thread":
      return "/community-forum/create-thread"
    default:
      return "/"
  }
}

interface Course {
  id: string;
  title: string;
  description: string;
}

export default function CreateThreadPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const onNavigate = (page: string) => router.push(pageToPath(page))
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [threadForm, setThreadForm] = useState({
    title: "",
    body: "",
    categoryType: "existing", // "existing" or "new"
    existingCategoryId: "general",
    newCategoryName: "",
    newCategoryDescription: ""
  })
  const { isOnline } = useOffline()
  const [userId, setUserId] = useState<string>("")

  // Authentication check
  useEffect(() => {
    if (status === "loading") return // Still loading
    
    if (!session) {
      // Redirect to login if not authenticated
      router.push("/login")
      return
    }

    // Set user ID for offline functionality
    if (session?.user?.id) {
      setUserId(session.user.id)
    }
  }, [session, status, router])

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/courses/public", { cache: "no-store" })
      if (res.ok) {
        const coursesData = await res.json()
        setCourses(coursesData)
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const createThread = useCallback(async () => {
    // Validation
    if (!threadForm.title.trim()) {
      toast.error("Please enter a thread title")
      return
    }
    
    if (threadForm.title.trim().length < 3) {
      toast.error("Thread title must be at least 3 characters long")
      return
    }

    if (!threadForm.body.trim()) {
      toast.error("Please enter thread content")
      return
    }
    
    if (threadForm.body.trim().length < 10) {
      toast.error("Thread content must be at least 10 characters long")
      return
    }

    if (threadForm.categoryType === "new" && !isOnline) {
      toast.error("Creating new categories requires an internet connection")
      return
    }

    if (threadForm.categoryType === "new") {
      if (!threadForm.newCategoryName.trim()) {
        toast.error("Please provide a category name")
        return
      }
      
      if (threadForm.newCategoryName.trim().length < 3) {
        toast.error("Category name must be at least 3 characters long")
        return
      }
    }

    setLoading(true)
    try {
      let courseId = threadForm.existingCategoryId === "general" ? undefined : threadForm.existingCategoryId

      // If creating a new category, create the course first (online only)
      if (threadForm.categoryType === "new" && isOnline) {
        const categoryName = threadForm.newCategoryName.trim()
        const categoryDescription = threadForm.newCategoryDescription.trim() || 
          `Discussion category for ${categoryName}. Share knowledge, ask questions, and connect with others interested in ${categoryName}.`
        
        console.log("Creating new category:", { categoryName, categoryDescription })
        
        const courseRes = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: categoryName,
            description: categoryDescription,
            price: 0,
            status: "published"
          }),
        })

        if (!courseRes.ok) {
          const error = await courseRes.json().catch(() => ({ message: `HTTP ${courseRes.status}` }))
          console.error("Course creation failed:", error)
          
          if (courseRes.status === 400 && error.details) {
            const validationErrors = error.details.map((err: any) => err.message).join(', ')
            throw new Error(`Category validation error: ${validationErrors}`)
          }
          
          throw new Error(error.message || `Failed to create category (${courseRes.status})`)
        }

        const newCourse = await courseRes.json()
        courseId = newCourse.id
      }

      // Create the thread (online or offline)
      if (isOnline) {
        const threadRes = await fetch("/api/forum/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: threadForm.title.trim(),
            body: threadForm.body.trim(),
            courseId: (courseId && courseId !== "general") ? courseId : undefined
          }),
        })

        if (!threadRes.ok) {
          const error = await threadRes.json()
          throw new Error(error.message || "Failed to create thread")
        }

        const newThread = await threadRes.json()
        toast.success("Thread created successfully!")
        
        // Navigate to the new thread
        router.push(`/community-forum/thread/${newThread.id}`)
      } else {
        // Create thread offline
        if (!userId) {
          throw new Error("User session not available for offline posting")
        }

        await offlineManager.createForumPost({
          userId,
          courseId: (courseId && courseId !== "general") ? courseId : undefined,
          title: threadForm.title.trim(),
          content: threadForm.body.trim(),
          createdAt: new Date()
        })

        toast.success("Thread saved offline! It will be posted when you&apos;re back online.")
        
        // Navigate back to forum
        router.push("/community-forum")
      }
    } catch (error) {
      console.error("Error creating thread:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create thread. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [threadForm, router, isOnline, userId])

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="community-forum" onNavigate={onNavigate} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/community-forum")}
            className="text-primary hover:text-primary/80 mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forum
          </button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Create New Thread</h1>
            <Badge variant={isOnline ? "secondary" : "outline"}>
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Start a new discussion in the community
            {!isOnline && " (Will be posted when you&apos;re back online)"}
          </p>
        </div>

        <Card className="p-8">
          <div className="space-y-6">
            {/* Thread Title */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Thread Title *
              </label>
              <Input
                placeholder="Enter a descriptive title for your thread..."
                value={threadForm.title}
                onChange={(e) => setThreadForm(prev => ({ ...prev, title: e.target.value }))}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 3 characters ({threadForm.title.length}/3)
              </p>
            </div>

            {/* Category Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Category
              </label>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="categoryType"
                      value="existing"
                      checked={threadForm.categoryType === "existing"}
                      onChange={(e) => setThreadForm(prev => ({ ...prev, categoryType: e.target.value }))}
                      className="text-primary"
                    />
                    <span className="text-sm">Use existing category</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="categoryType"
                      value="new"
                      checked={threadForm.categoryType === "new"}
                      onChange={(e) => setThreadForm(prev => ({ ...prev, categoryType: e.target.value }))}
                      className="text-primary"
                      disabled={!isOnline}
                    />
                    <span className={`text-sm ${!isOnline ? 'text-muted-foreground' : ''}`}>
                      Create new category
                      {!isOnline && " (Requires internet)"}
                    </span>
                  </label>
                </div>

                {threadForm.categoryType === "existing" ? (
                  <Select 
                    value={threadForm.existingCategoryId} 
                    onValueChange={(value) => setThreadForm(prev => ({ ...prev, existingCategoryId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category or leave empty for General Discussion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Discussion</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        New Category Name *
                      </label>
                      <Input
                        placeholder="Enter category name..."
                        value={threadForm.newCategoryName}
                        onChange={(e) => setThreadForm(prev => ({ ...prev, newCategoryName: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum 3 characters ({threadForm.newCategoryName.length}/3)
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Category Description (Optional)
                      </label>
                      <Textarea
                        placeholder="Describe what this category is about..."
                        value={threadForm.newCategoryDescription}
                        onChange={(e) => setThreadForm(prev => ({ ...prev, newCategoryDescription: e.target.value }))}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {threadForm.newCategoryDescription.trim() ? 
                          `${threadForm.newCategoryDescription.length} characters` :
                          threadForm.newCategoryName.trim() ? 
                            `Auto-generated: &quot;Discussion category for ${threadForm.newCategoryName.trim()}. Share knowledge, ask questions, and connect with others interested in ${threadForm.newCategoryName.trim()}.&quot;` :
                            "Will be auto-generated based on category name"
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Thread Content */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Thread Content *
              </label>
              <Textarea
                placeholder="Describe your question, topic, or discussion point in detail..."
                value={threadForm.body}
                onChange={(e) => setThreadForm(prev => ({ ...prev, body: e.target.value }))}
                rows={8}
                className="resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-muted-foreground">
                  Be specific and provide context to help others understand and respond to your thread.
                </p>
                <p className={`text-xs ${threadForm.body.length >= 10 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {threadForm.body.length}/10 characters minimum
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push("/community-forum")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={createThread}
                disabled={
                  loading || 
                  !threadForm.title.trim() || 
                  threadForm.title.trim().length < 3 ||
                  !threadForm.body.trim() || 
                  threadForm.body.trim().length < 10 ||
                  (threadForm.categoryType === "new" && (!threadForm.newCategoryName.trim() || threadForm.newCategoryName.trim().length < 3))
                }
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                {loading ? (
                  threadForm.categoryType === "new" ? "Creating category & thread..." : "Creating thread..."
                ) : "Create Thread"}
              </Button>
            </div>

            {/* Offline Warning */}
            {!isOnline && (
              <div className="text-sm bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Offline Mode</h4>
                </div>
                <ul className="space-y-1 text-xs text-yellow-700 dark:text-yellow-300">
                  <li>• Your thread will be saved locally and posted when you&apos;re back online</li>
                  <li>• You can only use existing categories while offline</li>
                  <li>• Creating new categories requires an internet connection</li>
                </ul>
              </div>
            )}

            {/* Help Text */}
            <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Tips for creating a great thread:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Use a clear, descriptive title that summarizes your topic</li>
                <li>• Choose the most relevant category or create a new one if needed</li>
                <li>• Provide enough context and details in your description</li>
                <li>• Be respectful and follow community guidelines</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}