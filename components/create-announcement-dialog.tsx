"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface Course {
  id: string
  title: string
}

interface CreateAnnouncementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAnnouncementCreated: (announcement: any) => void
  courseId?: string
  editingAnnouncement?: {
    id: string
    title: string
    content: string
    isPublic: boolean
    courseId?: string
  }
}

export function CreateAnnouncementDialog({
  open,
  onOpenChange,
  onAnnouncementCreated,
  courseId,
  editingAnnouncement
}: CreateAnnouncementDialogProps) {
  const { data: session } = useSession()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState(courseId || "")
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)

  // Debug logging
  console.log("CreateAnnouncementDialog - open:", open, "session:", session?.user?.role)

  useEffect(() => {
    if (open && session?.user?.role === "TEACHER") {
      fetchCourses()
    }
  }, [open, session])

  useEffect(() => {
    if (courseId) {
      setSelectedCourseId(courseId)
    }
  }, [courseId])

  useEffect(() => {
    if (editingAnnouncement) {
      setTitle(editingAnnouncement.title)
      setContent(editingAnnouncement.content)
      setIsPublic(editingAnnouncement.isPublic)
      setSelectedCourseId(editingAnnouncement.courseId || "")
    } else {
      // Reset form when not editing
      setTitle("")
      setContent("")
      setIsPublic(false)
      if (!courseId) {
        setSelectedCourseId("")
      }
    }
  }, [editingAnnouncement, courseId])

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true)
      const response = await fetch("/api/courses?teacher=true")
      if (!response.ok) {
        console.error("Failed to fetch courses:", response.status, response.statusText)
        throw new Error("Failed to fetch courses")
      }

      const data = await response.json()
      console.log("Courses API response:", data)
      
      // Handle different response formats
      if (Array.isArray(data)) {
        setCourses(data)
      } else if (data.courses && Array.isArray(data.courses)) {
        setCourses(data.courses)
      } else {
        console.warn("Unexpected courses API response format:", data)
        setCourses([])
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast.error("Failed to load courses")
    } finally {
      setLoadingCourses(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("HandleSubmit called - title:", title, "content:", content)

    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)

      const payload = {
        title: title.trim(),
        content: content.trim(),
        isPublic,
        courseId: selectedCourseId && selectedCourseId !== "none" ? selectedCourseId : undefined,
      }

      console.log("Sending announcement payload:", payload)

      const url = editingAnnouncement 
        ? `/api/announcements/${editingAnnouncement.id}`
        : "/api/announcements"
      const method = editingAnnouncement ? "PUT" : "POST"
      
      console.log("Making request:", { url, method, editingAnnouncement: !!editingAnnouncement })
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error("API Error:", error)
        throw new Error(error.error || `Failed to ${editingAnnouncement ? 'update' : 'create'} announcement`)
      }

      const announcement = await response.json()
      console.log(`${editingAnnouncement ? 'Updated' : 'Created'} announcement:`, announcement)
      onAnnouncementCreated(announcement)

      // Only reset form when creating new announcement, not when editing
      if (!editingAnnouncement) {
        setTitle("")
        setContent("")
        setIsPublic(false)
        if (!courseId) {
          setSelectedCourseId("")
        }
      }
    } catch (error) {
      console.error("Error creating announcement:", error)
      toast.error(error instanceof Error ? error.message : `Failed to ${editingAnnouncement ? 'update' : 'create'} announcement`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            {editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title..."
              maxLength={200}
              required
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/200 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement content..."
              rows={4}
              maxLength={2000}
              required
              className="resize-none min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              {content.length}/2000 characters
            </p>
          </div>

          {!courseId && (
            <div className="space-y-2">
              <Label htmlFor="course" className="text-sm font-medium">Course (Optional)</Label>
              <Select
                value={selectedCourseId || "none"}
                onValueChange={(value) => setSelectedCourseId(value === "none" ? "" : value)}
                disabled={loadingCourses}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a course (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific course</SelectItem>
                  {Array.isArray(courses) && courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingCourses && (
                <p className="text-xs text-muted-foreground">Loading courses...</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="isPublic" className="text-sm font-medium">
                Make this announcement public
              </Label>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              {isPublic
                ? "All students will see this announcement"
                : selectedCourseId && selectedCourseId !== "none"
                  ? "Only students enrolled in the selected course will see this"
                  : "Only students enrolled in your courses will see this"
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading 
                ? (editingAnnouncement ? "Updating..." : "Creating...") 
                : (editingAnnouncement ? "Update Announcement" : "Create Announcement")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}