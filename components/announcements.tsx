"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Plus, Edit, Trash2, Globe, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { CreateAnnouncementDialog } from "./create-announcement-dialog"
import { toast } from "sonner"

interface Announcement {
  id: string
  title: string
  content: string
  isPublic: boolean
  createdAt: string
  author: {
    id: string
    name: string | null
    image: string | null
  }
  course: {
    id: string
    title: string
  } | null
  isLiked: boolean
  likesCount: number
}

interface AnnouncementsProps {
  courseId?: string
  autoOpenCreate?: boolean
}

export function Announcements({ courseId, autoOpenCreate }: AnnouncementsProps) {
  const { data: session } = useSession()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<{
    id: string
    title: string
    content: string
    isPublic: boolean
    courseId?: string
  } | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchAnnouncements = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "10"
      })

      if (courseId) {
        params.append("courseId", courseId)
      }

      const response = await fetch(`/api/announcements?${params}`)
      if (!response.ok) throw new Error("Failed to fetch announcements")

      const data = await response.json()

      if (reset) {
        setAnnouncements(data.announcements)
      } else {
        setAnnouncements(prev => [...prev, ...data.announcements])
      }

      setHasMore(data.pagination.page < data.pagination.totalPages)
      setPage(pageNum)
    } catch (error) {
      console.error("Error fetching announcements:", error)
      toast.error("Failed to load announcements")
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchAnnouncements(1, true)
  }, [fetchAnnouncements])

  useEffect(() => {
    if (autoOpenCreate && session?.user?.role === "TEACHER") {
      setShowCreateDialog(true)
    }
  }, [autoOpenCreate, session])

  const handleLike = async (announcementId: string, isCurrentlyLiked: boolean) => {
    try {
      const method = isCurrentlyLiked ? "DELETE" : "POST"
      const response = await fetch(`/api/announcements/${announcementId}/like`, {
        method
      })

      if (!response.ok) throw new Error("Failed to update like")

      const data = await response.json()

      setAnnouncements(prev =>
        prev.map(announcement =>
          announcement.id === announcementId
            ? {
              ...announcement,
              isLiked: data.isLiked,
              likesCount: data.likesCount
            }
            : announcement
        )
      )
    } catch (error) {
      console.error("Error updating like:", error)
      toast.error("Failed to update like")
    }
  }

  const handleDelete = async (announcementId: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return

    try {
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Failed to delete announcement")

      setAnnouncements(prev => prev.filter(a => a.id !== announcementId))
      toast.success("Announcement deleted successfully")
    } catch (error) {
      console.error("Error deleting announcement:", error)
      toast.error("Failed to delete announcement")
    }
  }

  const handleAnnouncementCreated = (newAnnouncement: Announcement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev])
    setShowCreateDialog(false)
    toast.success("Announcement created successfully")
  }

  const handleAnnouncementUpdated = (updatedAnnouncement: Announcement) => {
    setAnnouncements(prev =>
      prev.map(announcement =>
        announcement.id === updatedAnnouncement.id ? updatedAnnouncement : announcement
      )
    )
    setEditingAnnouncement(null)
    toast.success("Announcement updated successfully")
  }

  const handleEdit = (announcement: Announcement) => {
    // Transform the announcement to match the dialog's expected format
    const editingData = {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      isPublic: announcement.isPublic,
      courseId: announcement.course?.id || undefined
    }
    setEditingAnnouncement(editingData)
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      setLoading(true)
      fetchAnnouncements(page + 1, false)
    }
  }

  if (loading && announcements.length === 0) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-24 sm:w-32" />
                  <div className="h-2 sm:h-3 bg-gray-200 rounded w-16 sm:w-24" />
                </div>
              </div>
              <div className="h-4 sm:h-5 bg-gray-200 rounded w-3/4 mt-3" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-full" />
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Announcements</h2>
        {session?.user?.role === "TEACHER" && (
          <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            <span className="sm:hidden">New Announcement</span>
            <span className="hidden sm:inline">New Announcement</span>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-6 sm:py-8 text-center text-muted-foreground">
              <p className="text-sm sm:text-base">No announcements yet.</p>
              {session?.user?.role === "TEACHER" && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(true)}
                    className="w-full sm:w-auto"
                  >
                    Create your first announcement
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                      <AvatarImage src={announcement.author.image || ""} />
                      <AvatarFallback className="text-xs sm:text-sm">
                        {announcement.author.name?.[0] || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <p className="font-medium text-sm sm:text-base truncate">{announcement.author.name}</p>
                        <Badge variant={announcement.isPublic ? "default" : "secondary"} className="text-xs self-start">
                          {announcement.isPublic ? (
                            <>
                              <Globe className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Public</span>
                              <span className="sm:hidden">Public</span>
                            </>
                          ) : (
                            <>
                              <Users className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Course Only</span>
                              <span className="sm:hidden">Course</span>
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                        <div>{formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}</div>
                        {announcement.course && (
                          <div className="truncate mt-1 sm:mt-0 sm:inline sm:ml-2">
                            <span className="hidden sm:inline">• </span>
                            {announcement.course.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {session?.user?.id === announcement.author.id && (
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  )}
                </div>
                <CardTitle className="text-base sm:text-lg mt-3 break-words">{announcement.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm sm:text-base text-muted-foreground mb-4 whitespace-pre-wrap break-words">
                  {announcement.content}
                </p>

                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(announcement.id, announcement.isLiked)}
                    className={`h-8 sm:h-9 ${announcement.isLiked ? "text-red-500" : ""}`}
                  >
                    <Heart
                      className={`w-4 h-4 mr-2 ${announcement.isLiked ? "fill-current" : ""}`}
                    />
                    <span className="text-sm">{announcement.likesCount}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      <CreateAnnouncementDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onAnnouncementCreated={handleAnnouncementCreated}
        courseId={courseId}
      />

      {editingAnnouncement && (
        <CreateAnnouncementDialog
          open={!!editingAnnouncement}
          onOpenChange={(open) => !open && setEditingAnnouncement(null)}
          onAnnouncementCreated={handleAnnouncementUpdated}
          courseId={courseId}
          editingAnnouncement={editingAnnouncement}
        />
      )}
    </div>
  )
}