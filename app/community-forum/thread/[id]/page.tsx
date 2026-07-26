"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Share2, ArrowLeft, Send } from "lucide-react"

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

// Types
interface Author {
  name?: string | null;
  image?: string | null;
}

interface Thread {
  id: string;
  title: string;
  body: string;
  author?: Author | null;
  courseId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    replies: number;
  };
}

interface ThreadReply {
  id: string;
  body: string;
  author?: Author | null;
  createdAt?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
}

export default function ThreadPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const threadId = params.id as string

  const onNavigate = (page: string) => router.push(pageToPath(page))

  // Authentication check
  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      // Redirect to login if not authenticated
      router.push("/login")
      return
    }
  }, [session, status, router])

  const [loading, setLoading] = useState(false)
  const [threadDetail, setThreadDetail] = useState<Thread | null>(null)
  const [repliesData, setRepliesData] = useState<{ items: ThreadReply[]; page: number; pages: number; total: number } | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [replyText, setReplyText] = useState("")
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null)
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<Record<string, string>>({}) // Track which reply is responding to which
  const [hoveredReply, setHoveredReply] = useState<string | null>(null) // Track hovered reply for highlighting
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [relatedThreads, setRelatedThreads] = useState<Thread[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)

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

  const fetchRelatedThreads = useCallback(async () => {
    if (!threadDetail) return

    setLoadingRelated(true)
    try {
      const params = new URLSearchParams()
      params.set("limit", "5")
      if (threadDetail.courseId) {
        params.set("courseId", threadDetail.courseId)
      }

      const res = await fetch(`/api/forum/threads?${params.toString()}`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        // Filter out the current thread and limit to 5 results
        const related = (data.items || [])
          .filter((thread: Thread) => thread.id !== threadDetail.id)
          .slice(0, 5)
        setRelatedThreads(related)
      }
    } catch (error) {
      console.error("Error fetching related threads:", error)
    } finally {
      setLoadingRelated(false)
    }
  }, [threadDetail])

  const fetchThread = useCallback(async () => {
    if (!threadId) return

    setLoading(true)
    try {
      const [tRes, rRes] = await Promise.all([
        fetch(`/api/forum/threads/${threadId}`, { cache: "no-store" }),
        fetch(`/api/forum/threads/${threadId}/replies?page=1`, { cache: "no-store" }),
      ])

      if (!tRes.ok || !rRes.ok) {
        throw new Error(`Failed to fetch thread data: ${tRes.status} ${rRes.status}`)
      }

      const thread = await tRes.json() as Thread
      const replies = await rRes.json() as { items: ThreadReply[]; total: number; page: number; pages: number }

      setThreadDetail(thread)
      setRepliesData({
        items: replies.items || [],
        page: replies.page || 1,
        pages: replies.pages || 1,
        total: replies.total || 0
      })
    } catch (error) {
      console.error("Error fetching thread:", error)
      alert("Failed to load thread. Please try again.")
      router.push("/community-forum")
    } finally {
      setLoading(false)
    }
  }, [threadId, router])

  const postReply = useCallback(async (replyId?: string) => {
    const text = replyId ? replyTexts[replyId] : replyText
    if (!text?.trim()) return

    setLoading(true)
    try {
      // Add threading information to the reply
      let replyBody = text.trim()
      if (replyId && replyingTo[replyId]) {
        const parentReply = repliesData?.items.find(r => r.id === replyingTo[replyId])
        if (parentReply) {
          replyBody = `@${parentReply.author?.name || 'User'} ${replyBody}`
        }
      }

      const postRes = await fetch(`/api/forum/threads/${threadId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody }),
      })

      if (!postRes.ok) {
        const error = await postRes.json()
        throw new Error(error.message || `Failed to post reply: ${postRes.status}`)
      }

      // Clear the appropriate reply text
      if (replyId) {
        setReplyTexts(prev => ({ ...prev, [replyId]: "" }))
        setShowReplyForm(null)
      } else {
        setReplyText("")
      }

      // Refresh the replies after posting
      await fetchThread()
    } catch (error) {
      console.error("Error posting reply:", error)
      alert(error instanceof Error ? error.message : "Failed to post reply. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [threadId, replyText, replyTexts, repliesData?.items, replyingTo, fetchThread])

  const toggleReplyForm = useCallback((replyId: string, parentReplyId?: string) => {
    setShowReplyForm(prev => {
      if (prev === replyId) return null
      return replyId
    })

    // Track what this reply is responding to
    if (parentReplyId) {
      setReplyingTo(prev => ({ ...prev, [replyId]: parentReplyId }))
    }
  }, [])

  const updateReplyText = useCallback((replyId: string, text: string) => {
    setReplyTexts(prev => ({ ...prev, [replyId]: text }))
  }, [])

  const handleLike = useCallback(async (type: 'thread' | 'reply', id: string) => {
    try {
      const isCurrentlyLiked = likedItems.has(id)

      // For now, implement client-side like functionality
      // TODO: Implement proper database-backed likes later
      const newLikedItems = new Set(likedItems)
      if (isCurrentlyLiked) {
        newLikedItems.delete(id)
        setLikeCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }))
      } else {
        newLikedItems.add(id)
        setLikeCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
      }
      setLikedItems(newLikedItems)

      // Store in localStorage for persistence
      const storageKey = `forum_likes_${type}`
      const existingLikes = JSON.parse(localStorage.getItem(storageKey) || '{}')
      if (isCurrentlyLiked) {
        delete existingLikes[id]
      } else {
        existingLikes[id] = true
      }
      localStorage.setItem(storageKey, JSON.stringify(existingLikes))

      // Store counts in localStorage
      const countsKey = `forum_like_counts`
      const existingCounts = JSON.parse(localStorage.getItem(countsKey) || '{}')
      existingCounts[id] = (existingCounts[id] || 0) + (isCurrentlyLiked ? -1 : 1)
      if (existingCounts[id] <= 0) {
        delete existingCounts[id]
      }
      localStorage.setItem(countsKey, JSON.stringify(existingCounts))

    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }, [likedItems])

  const handleShare = useCallback(async (type: 'thread' | 'reply', id: string) => {
    const shareUrl = type === 'thread'
      ? `${window.location.origin}/community-forum/thread/${id}`
      : `${window.location.origin}/community-forum/thread/${threadId}#reply-${id}`

    const shareData = {
      title: type === 'thread' ? threadDetail?.title : 'Forum Reply',
      text: type === 'thread'
        ? `Check out this discussion: ${threadDetail?.title}`
        : 'Check out this reply in the forum',
      url: shareUrl
    }

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied to clipboard!')
      }
    } catch (error) {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied to clipboard!')
      } catch (clipboardError) {
        console.error('Failed to share or copy:', error, clipboardError)
        alert('Unable to share. Please copy the URL manually.')
      }
    }
  }, [threadDetail?.title, threadId])

  // Load likes from localStorage on mount
  useEffect(() => {
    const loadLikes = () => {
      try {
        const threadLikes = JSON.parse(localStorage.getItem('forum_likes_thread') || '{}')
        const replyLikes = JSON.parse(localStorage.getItem('forum_likes_reply') || '{}')
        const counts = JSON.parse(localStorage.getItem('forum_like_counts') || '{}')

        const allLikes = new Set([...Object.keys(threadLikes), ...Object.keys(replyLikes)])
        setLikedItems(allLikes)
        setLikeCounts(counts)
      } catch (error) {
        console.error('Error loading likes from localStorage:', error)
      }
    }

    loadLikes()
    fetchThread()
    fetchCourses()
  }, [fetchThread, fetchCourses])

  // Fetch related threads when thread details are loaded
  useEffect(() => {
    if (threadDetail) {
      fetchRelatedThreads()
    }
  }, [threadDetail, fetchRelatedThreads])

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

  if (loading && !threadDetail) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation currentPage="community-forum" onNavigate={onNavigate} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading thread...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!threadDetail) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation currentPage="community-forum" onNavigate={onNavigate} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">Thread not found</h3>
            <p className="text-muted-foreground mb-4">The thread you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Button onClick={() => router.push("/community-forum")}>
              Back to Forum
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navigation currentPage="community-forum" onNavigate={onNavigate} />
      <div className="max-w-none lg:max-w-[95vw] xl:max-w-[90vw] mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 flex-1 flex flex-col overflow-hidden">
        {/* Header Section - Fixed */}
        <div className="flex-shrink-0 mb-4 sm:mb-6">
          {/* Back Button */}
          <button
            onClick={() => router.push("/community-forum")}
            className="text-primary hover:text-primary/80 mb-3 sm:mb-4 flex items-center gap-2 touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm sm:text-base">Back to Forum</span>
          </button>

          {/* Thread Header */}
          <div>
            <span className="text-xs sm:text-sm text-muted-foreground mb-2 inline-block break-words">
              {threadDetail.courseId ?
                courses.find(c => c.id === threadDetail.courseId)?.title || 'Course' :
                'General Discussion'
              }
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground break-words">
              {threadDetail.title}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 flex-1 min-h-0 overflow-hidden">
          <div className="lg:col-span-3 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <div className="pr-4 pb-4">
                {/* Original Post */}
                <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
                  <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <Image
                      src={threadDetail.author?.image || "/placeholder.svg"}
                      alt="User"
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
                      width={48}
                      height={48}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base break-words">
                          {threadDetail.author?.name ?? "Anonymous"}
                        </h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded w-fit">
                          Original Poster
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(threadDetail.createdAt ?? Date.now()).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-foreground leading-relaxed mb-3 sm:mb-4 break-words">{threadDetail.body}</p>
                  <div className="flex flex-wrap gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
                    <button
                      onClick={() => handleLike('thread', threadDetail.id)}
                      className={`flex items-center gap-2 transition-colors text-xs sm:text-sm touch-manipulation ${likedItems.has(threadDetail.id)
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-muted-foreground hover:text-red-500'
                        }`}
                    >
                      <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${likedItems.has(threadDetail.id) ? 'fill-current' : ''}`} />
                      <span className="break-words">
                        {likedItems.has(threadDetail.id) ? 'Liked' : 'Like'}
                        {likeCounts[threadDetail.id] > 0 && ` (${likeCounts[threadDetail.id]})`}
                      </span>
                    </button>
                    <button
                      onClick={() => toggleReplyForm("main")}
                      className={`flex items-center gap-2 transition-colors text-xs sm:text-sm touch-manipulation ${showReplyForm === "main"
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                        }`}
                    >
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Reply</span>
                    </button>
                    <button
                      onClick={() => handleShare('thread', threadDetail.id)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors text-xs sm:text-sm touch-manipulation"
                    >
                      <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* Inline Reply Form for Main Thread */}
                  {showReplyForm === "main" && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border bg-primary/5 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                          <Textarea
                            placeholder="Write your reply to this thread..."
                            value={replyTexts["main"] || ""}
                            onChange={(e) => updateReplyText("main", e.target.value)}
                            rows={3}
                            className="text-sm border-0 bg-background resize-none"
                          />
                          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowReplyForm(null)}
                              className="w-full sm:w-auto text-sm"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => postReply("main")}
                              disabled={loading || !(replyTexts["main"]?.trim())}
                              className="gap-2 w-full sm:w-auto text-sm"
                            >
                              <Send className="w-3 h-3" />
                              {loading ? "Posting..." : "Reply"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Replies */}
                <div className="space-y-3 sm:space-y-4 relative">
                  {/* Add test content to ensure scrolling works */}
                  {(repliesData?.items ?? []).length === 0 && (
                    <>
                      {Array.from({ length: 15 }, (_, i) => (
                        <Card key={`test-${i}`} className="p-4 sm:p-6">
                          <div className="flex items-start gap-3 sm:gap-4 mb-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex-shrink-0"></div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm mb-1">Test User {i + 1}</h4>
                              <p className="text-xs text-muted-foreground mb-2">Just now</p>
                              <p className="text-sm">This is a test reply #{i + 1} to demonstrate scrolling functionality. The content should be long enough to show multiple replies and test the scroll behavior.</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </>
                  )}
                  {(repliesData?.items ?? []).map((reply: any, idx: number) => {
                    // Check if this reply is threaded (mentions another user)
                    const isThreadedReply = reply.body.startsWith('@')
                    // For testing: make every second reply threaded to see the lines
                    const threadLevel = isThreadedReply || idx % 2 === 1 ? 1 : 0

                    // Extract the mentioned user if it's a threaded reply
                    const mentionedUser = isThreadedReply ? reply.body.match(/@(\w+)/)?.[1] : 'TestUser'

                    return (
                      <div key={reply.id ?? idx} className="relative">
                        {/* Threading Visual Elements - Hidden on mobile for cleaner look */}
                        {threadLevel > 0 && (
                          <>
                            {/* Vertical line connecting to parent */}
                            <div className={`hidden sm:block absolute left-4 top-0 w-1 h-8 transition-colors duration-200 bg-primary/30 z-10`}></div>
                            {/* Horizontal connector */}
                            <div className={`hidden sm:block absolute left-4 top-8 w-8 h-1 transition-colors duration-200 bg-primary/30 z-10`}></div>
                            {/* Corner connector dot */}
                            <div className={`hidden sm:block absolute left-3 top-7 w-3 h-3 rounded-full transition-colors duration-200 bg-primary/50 z-10`}></div>
                          </>
                        )}

                        <Card
                          id={`reply-${reply.id}`}
                          className={`p-4 sm:p-6 relative transition-all duration-200 ${threadLevel > 0 ? 'sm:ml-10 border-l-2 border-l-primary/20 bg-primary/5' : ''
                            } ${hoveredReply === reply.id ? 'ring-2 ring-primary/20 shadow-md' : ''
                            }`}
                          onMouseEnter={() => setHoveredReply(reply.id)}
                          onMouseLeave={() => setHoveredReply(null)}
                        >
                          <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                            <Image
                              src={reply.author?.image || "/placeholder.svg"}
                              alt={reply.author?.name ?? "User"}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                              width={40}
                              height={40}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                <h4 className="font-semibold text-foreground text-sm break-words">{reply.author?.name ?? "User"}</h4>
                                {threadLevel > 0 && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                                    <MessageCircle className="w-3 h-3" />
                                    <span className="hidden sm:inline">{mentionedUser ? `Replying to @${mentionedUser}` : 'Threaded Reply'}</span>
                                    <span className="sm:hidden">Reply</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{new Date(reply.createdAt ?? Date.now()).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap mb-3 sm:mb-4">
                            {threadLevel > 0 && mentionedUser && (
                              <div className="mb-2 p-2 bg-muted/50 rounded-md border-l-2 border-primary/30">
                                <p className="text-xs text-muted-foreground mb-1 break-words">Replying to @{mentionedUser}:</p>
                              </div>
                            )}
                            <p className="break-words">{reply.body}</p>
                          </div>

                          {/* Reply Interaction Buttons */}
                          <div className="flex flex-wrap gap-3 sm:gap-4 pt-3 border-t border-border">
                            <button
                              onClick={() => handleLike('reply', reply.id)}
                              className={`flex items-center gap-2 transition-colors text-xs touch-manipulation ${likedItems.has(reply.id)
                                ? 'text-red-500 hover:text-red-600'
                                : 'text-muted-foreground hover:text-red-500'
                                }`}
                            >
                              <Heart className={`w-3 h-3 ${likedItems.has(reply.id) ? 'fill-current' : ''}`} />
                              <span className="break-words">
                                {likedItems.has(reply.id) ? 'Liked' : 'Like'}
                                {likeCounts[reply.id] > 0 && ` (${likeCounts[reply.id]})`}
                              </span>
                            </button>
                            <button
                              onClick={() => toggleReplyForm(`reply-${reply.id}`, reply.id)}
                              className={`flex items-center gap-2 transition-colors text-xs touch-manipulation ${showReplyForm === `reply-${reply.id}`
                                ? "text-primary"
                                : "text-muted-foreground hover:text-primary"
                                }`}
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Reply</span>
                            </button>
                            <button
                              onClick={() => handleShare('reply', reply.id)}
                              className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors text-xs touch-manipulation"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>Share</span>
                            </button>
                          </div>

                          {/* Inline Reply Form for Each Reply */}
                          {showReplyForm === `reply-${reply.id}` && (
                            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border bg-muted/20 rounded-lg p-3 sm:p-4">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                                </div>
                                <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                                  <Textarea
                                    placeholder={`Reply to ${reply.author?.name ?? "User"}...`}
                                    value={replyTexts[`reply-${reply.id}`] || ""}
                                    onChange={(e) => updateReplyText(`reply-${reply.id}`, e.target.value)}
                                    rows={3}
                                    className="text-sm border-0 bg-background resize-none"
                                  />
                                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setShowReplyForm(null)}
                                      className="w-full sm:w-auto text-sm"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => postReply(`reply-${reply.id}`)}
                                      disabled={loading || !(replyTexts[`reply-${reply.id}`]?.trim())}
                                      className="gap-2 w-full sm:w-auto text-sm"
                                    >
                                      <Send className="w-3 h-3" />
                                      {loading ? "Posting..." : "Reply"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Card>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Hidden on mobile */}
          <div className="hidden lg:flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <div className="space-y-3 sm:space-y-4 pr-4 pb-4">
                <Card className="p-4 sm:p-6">
                  <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Thread Stats</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs sm:text-sm">Created</span>
                      <span className="font-semibold text-foreground text-xs sm:text-sm break-words text-right">
                        {threadDetail?.createdAt ? new Date(threadDetail.createdAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs sm:text-sm">Replies</span>
                      <span className="font-semibold text-foreground text-xs sm:text-sm">{threadDetail?._count?.replies ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs sm:text-sm">Category</span>
                      <span className="font-semibold text-foreground text-xs sm:text-sm break-words text-right max-w-[60%]">
                        {threadDetail?.courseId ?
                          courses.find(c => c.id === threadDetail.courseId)?.title || 'Course' :
                          'General'
                        }
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 sm:p-6">
                  <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Related Threads</h3>
                  <div className="space-y-2">
                    {loadingRelated ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    ) : relatedThreads.length > 0 ? (
                      relatedThreads.map((thread) => (
                        <button
                          key={thread.id}
                          onClick={() => router.push(`/community-forum/thread/${thread.id}`)}
                          className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors touch-manipulation"
                        >
                          <h4 className="font-medium text-sm text-foreground line-clamp-2 break-words mb-1">
                            {thread.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>by {thread.author?.name || 'Anonymous'}</span>
                            <span>•</span>
                            <span>{thread._count?.replies || 0} replies</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {thread.createdAt ? new Date(thread.createdAt).toLocaleDateString() : 'Recently'}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">No related threads found</p>
                        <button
                          onClick={() => router.push("/community-forum")}
                          className="text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          Browse all threads
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}