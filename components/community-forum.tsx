"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Search, Plus, TrendingUp, Wifi, WifiOff, Clock, Send, ChevronDown, Filter } from "lucide-react"
import { useOffline } from "@/hooks/use-offline"
import { offlineManager } from "@/lib/offline-manager"
import { toast } from "sonner"

interface CommunityForumProps {
  onNavigate: (page: string) => void
}

export function CommunityForum({ onNavigate }: CommunityForumProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [categorySearch, setCategorySearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [threadsData, setThreadsData] = useState<{ items: Thread[]; page: number; pages: number; total: number } | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const { isOnline } = useOffline()
  const [userId, setUserId] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false)
  const [showRecentActivitiesDropdown, setShowRecentActivitiesDropdown] = useState(false)

  // Get user info for offline functionality
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        if (session?.user?.id) {
          setUserId(session.user.id)
          setUserName(session.user.name || 'User')
        }
      })
      .catch(console.error)
  }, [])

  const refreshList = useCallback(async () => {
    setLoading(true)
    try {
      if (isOnline) {
        // If online, fetch fresh data first
        try {
          const params = new URLSearchParams()
          params.set("page", "1")
          if (searchQuery.trim()) params.set("q", searchQuery.trim())
          if (selectedCategory !== "all") params.set("courseId", selectedCategory)
          const res = await fetch(`/api/forum/threads?${params.toString()}`, { cache: "no-store" })
          if (!res.ok) {
            throw new Error(`Failed to fetch threads: ${res.status}`)
          }
          const json = await res.json()
          setThreadsData(json)
          
          // Cache the fresh data for offline use (but don't create duplicates)
          if (json.items && json.items.length > 0) {
            // Clear existing cached posts for this category to avoid duplicates
            try {
              await offlineManager.clearCachedForumPosts(selectedCategory !== "all" ? selectedCategory : undefined)
            } catch (clearError) {
              console.warn('Failed to clear cached posts:', clearError)
            }
            
            // Cache the new posts
            for (const thread of json.items) {
              try {
                await offlineManager.createForumPost({
                  userId: thread.author?.id || 'unknown',
                  courseId: thread.course?.id || selectedCategory !== "all" ? selectedCategory : undefined,
                  title: thread.title,
                  content: thread.body || thread.content || '',
                  createdAt: new Date(thread.createdAt)
                })
              } catch (cacheError) {
                // Ignore cache errors for individual posts
                console.warn('Failed to cache forum post:', cacheError)
              }
            }
          }
        } catch (fetchError) {
          console.log('Failed to fetch fresh threads, falling back to cached data')
          // Fall back to cached data if online fetch fails
          const cachedPosts = await offlineManager.getCachedForumPosts(selectedCategory !== "all" ? selectedCategory : undefined)
          
          if (cachedPosts.length > 0) {
            // Convert cached posts to thread format
            const cachedThreads = cachedPosts.map(post => ({
              id: post.id,
              title: post.title,
              body: post.content,
              createdAt: post.createdAt.toISOString(),
              author: { name: 'Cached User' }, // Simplified for cached posts
              course: selectedCategory !== "all" ? { title: 'Course' } : null,
              _count: { replies: post.replies?.length || 0 },
              synced: post.synced
            }))
            
            setThreadsData({
              items: cachedThreads,
              page: 1,
              pages: 1,
              total: cachedThreads.length
            })
          } else {
            throw fetchError
          }
        }
      } else {
        // Offline mode - load cached data only
        const cachedPosts = await offlineManager.getCachedForumPosts(selectedCategory !== "all" ? selectedCategory : undefined)
        
        if (cachedPosts.length > 0) {
          // Convert cached posts to thread format
          const cachedThreads = cachedPosts.map(post => ({
            id: post.id,
            title: post.title,
            body: post.content,
            createdAt: post.createdAt.toISOString(),
            author: { name: 'Cached User' }, // Simplified for cached posts
            course: selectedCategory !== "all" ? { title: 'Course' } : null,
            _count: { replies: post.replies?.length || 0 },
            synced: post.synced
          }))
          
          setThreadsData({
            items: cachedThreads,
            page: 1,
            pages: 1,
            total: cachedThreads.length
          })
        } else {
          // No cached data available
          setThreadsData({
            items: [],
            page: 1,
            pages: 1,
            total: 0
          })
        }
      }
    } catch (error) {
      console.error("Error fetching threads:", error)
      setThreadsData(null)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory, isOnline])

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

  // Base API types
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



  interface Course {
    id: string;
    title: string;
    description: string;
    _count?: {
      lessons: number;
      enrollments: number;
    };
  }

  // UI specific types
  interface UIThread {
    id: string;
    title: string;
    excerpt: string;
    author: string;
    avatar: string;
    categoryName: string;
    category: string;
    replies: number;
    timeAgo: string;
    lastActive: string;
    synced: boolean;
  }

  const openThread = useCallback((id: string) => {
    router.push(`/community-forum/thread/${id}`)
  }, [router])

  const navigateToCreateThread = useCallback(() => {
    router.push("/community-forum/create-thread")
  }, [router])

  useEffect(() => {
    refreshList()
    fetchCourses()
  }, [refreshList, fetchCourses])

  // Auto-search when search query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshList()
    }, 500) // Debounce search by 500ms

    return () => clearTimeout(timeoutId)
  }, [searchQuery, refreshList])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        setShowCategoriesDropdown(false)
        setShowRecentActivitiesDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const uiThreads = useMemo<UIThread[]>(() => {
    const threadsFromApi = threadsData?.items ?? []
    return threadsFromApi.map((t) => {
      const updatedAt = t.updatedAt || t.createdAt;
      const lastActive = updatedAt ? new Date(updatedAt).toLocaleDateString() : 'Recently';
      const timeAgo = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recently';

      // Find course name if courseId exists
      const course = courses.find(c => c.id === t.courseId)
      const categoryName = course ? course.title : (t.courseId ? 'Course' : 'General Discussion')

      return {
        id: t.id,
        title: t.title,
        excerpt: (t.body || '').slice(0, 140) + ((t.body?.length || 0) > 140 ? '…' : ''),
        author: t.author?.name || 'Anonymous',
        avatar: t.author?.image || '/placeholder.svg',
        categoryName,
        category: t.courseId ? 'course' : 'general',
        replies: t._count?.replies || 0,
        timeAgo,
        lastActive,
        synced: (t as any).synced !== false, // Assume synced unless explicitly marked as false
      };
    });
  }, [threadsData, courses]);

  const categories = useMemo(() => {
    const threadCount = threadsData?.total || 0
    const courseCategories = courses.map(course => ({
      id: course.id,
      name: course.title,
      count: threadsData?.items.filter(t => t.courseId === course.id).length || 0
    }))

    const allCategories = [
      { id: "all", name: "All Topics", count: threadCount },
      { id: "general", name: "General Discussion", count: threadsData?.items.filter(t => !t.courseId).length || 0 },
      ...courseCategories.filter(c => c.count > 0)
    ]

    // Filter categories based on search
    if (categorySearch.trim()) {
      return allCategories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
      )
    }

    return allCategories
  }, [courses, threadsData, categorySearch])

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div className="min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground break-words">Community Forum</h1>
                <Badge variant={isOnline ? "secondary" : "outline"} className="w-fit">
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
              <p className="text-sm sm:text-base text-muted-foreground break-words">
                Connect with learners and experts worldwide
                {!isOnline && " (Viewing cached posts)"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 flex-1 min-h-0 overflow-hidden relative">
          {/* Sidebar - Hidden on mobile */}
          <div className="hidden lg:flex lg:order-1 order-2 flex-col min-h-0 overflow-hidden">
            {/* Entire Sidebar Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
              <div className="space-y-3 sm:space-y-4 pb-4 pr-4">
                {/* New Thread Button */}
                <Button
                  onClick={navigateToCreateThread}
                  disabled={loading}
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 sm:h-11 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Thread</span>
                  <span className="sm:hidden">New Post</span>
                  {!isOnline && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      Offline
                    </Badge>
                  )}
                </Button>

                {/* Thread Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search discussions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2.5 sm:py-2 text-sm sm:text-base text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Categories */}
                <Card className="p-3 sm:p-4">
                  <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Categories</h3>

                  {/* Category Search */}
                  <div className="relative mb-3 sm:mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-2 sm:py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    {categories.length === 0 && categorySearch.trim() ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No categories found
                      </p>
                    ) : (
                      categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`w-full text-left px-3 py-2.5 sm:py-2 rounded-lg transition-colors text-sm touch-manipulation ${selectedCategory === cat.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted active:bg-muted/70"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="break-words min-w-0 flex-1">{cat.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{cat.count}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </Card>

                {/* Recent Activity */}
                <Card className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <TrendingUp className="w-4 h-4 text-secondary flex-shrink-0" />
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">Recent Activity</h3>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {uiThreads.slice(0, 3).map((thread) => (
                      <button
                        key={thread.id}
                        onClick={() => openThread(thread.id)}
                        className="text-left hover:text-primary transition-colors group w-full p-2 sm:p-0 rounded-lg hover:bg-muted/50 sm:hover:bg-transparent touch-manipulation"
                      >
                        <p className="text-sm font-medium text-foreground group-hover:text-primary line-clamp-2 break-words">
                          {thread.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{thread.replies} replies • {thread.timeAgo}</p>
                      </button>
                    ))}
                    {uiThreads.length === 0 && (
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 lg:order-2 order-1 flex flex-col min-h-0 overflow-hidden">
            {/* Mobile Controls - Only visible on mobile */}
            <div className="lg:hidden flex-shrink-0 mb-4 space-y-3 relative">
              {/* Backdrop for dropdowns */}
              {(showCategoriesDropdown || showRecentActivitiesDropdown) && (
                <div 
                  className="fixed inset-0 bg-black/20 z-40"
                  onClick={() => {
                    setShowCategoriesDropdown(false)
                    setShowRecentActivitiesDropdown(false)
                  }}
                />
              )}
              {/* New Thread Button */}
              <Button
                onClick={navigateToCreateThread}
                disabled={loading}
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-sm"
              >
                <Plus className="w-4 h-4" />
                New Thread
                {!isOnline && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    Offline
                  </Badge>
                )}
              </Button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Categories Dropdown */}
              <div className="relative dropdown-container">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCategoriesDropdown(!showCategoriesDropdown)
                    setShowRecentActivitiesDropdown(false)
                  }}
                  className="w-full justify-between h-11 text-sm overflow-hidden"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Filter className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Categories ({categories.find(c => c.id === selectedCategory)?.name || 'All Topics'})</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCategoriesDropdown ? 'rotate-180' : ''}`} />
                </Button>
                
                {showCategoriesDropdown && (
                  <Card className="absolute top-full left-0 right-0 mt-1 p-3 z-50 max-h-60 overflow-y-auto scrollbar-hide shadow-lg border">
                    {/* Category Search */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      {categories.length === 0 && categorySearch.trim() ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No categories found
                        </p>
                      ) : (
                        categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setSelectedCategory(cat.id)
                              setShowCategoriesDropdown(false)
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm touch-manipulation ${selectedCategory === cat.id
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-foreground hover:bg-muted active:bg-muted/70"
                              }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="break-words min-w-0 flex-1">{cat.name}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">{cat.count}</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </Card>
                )}
              </div>

              {/* Recent Activities Dropdown */}
              <div className="relative dropdown-container">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRecentActivitiesDropdown(!showRecentActivitiesDropdown)
                    setShowCategoriesDropdown(false)
                  }}
                  className="w-full justify-between h-11 text-sm overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Recent Activity</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showRecentActivitiesDropdown ? 'rotate-180' : ''}`} />
                </Button>
                
                {showRecentActivitiesDropdown && (
                  <Card className="absolute top-full left-0 right-0 mt-1 p-3 z-50 max-h-60 overflow-y-auto scrollbar-hide shadow-lg border">
                    <div className="space-y-3">
                      {uiThreads.slice(0, 5).map((thread) => (
                        <button
                          key={thread.id}
                          onClick={() => {
                            openThread(thread.id)
                            setShowRecentActivitiesDropdown(false)
                          }}
                          className="text-left hover:text-primary transition-colors group w-full p-2 rounded-lg hover:bg-muted/50 touch-manipulation"
                        >
                          <p className="text-sm font-medium text-foreground group-hover:text-primary line-clamp-2 break-words">
                            {thread.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{thread.replies} replies • {thread.timeAgo}</p>
                        </button>
                      ))}
                      {uiThreads.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">No recent activity</p>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
              <div className="pr-4">
                {loading && !threadsData ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-sm sm:text-base text-muted-foreground">Loading threads...</p>
                  </div>
                </div>
              ) : uiThreads.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No threads found</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 break-words">
                    {searchQuery ? "Try adjusting your search terms" : "Be the first to start a discussion!"}
                  </p>
                  <Button onClick={navigateToCreateThread} className="gap-2 w-full sm:w-auto">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create First Thread</span>
                    <span className="sm:hidden">Create Thread</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 pb-4">
                  {uiThreads.map((thread, index) => (
                    <Card
                      key={`${thread.id}-${index}`}
                      onClick={() => openThread(thread.id)}
                      className="p-4 sm:p-6 hover:shadow-md transition-all cursor-pointer hover:border-primary/50 touch-manipulation"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openThread(thread.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <Image
                          src={thread.avatar}
                          alt={thread.author}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                          width={40}
                          height={40}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                            <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary break-words">
                              {thread.categoryName}
                            </span>
                            <span className="text-xs text-muted-foreground break-words">by {thread.author}</span>
                            <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
                            <span className="text-xs text-muted-foreground">{thread.timeAgo}</span>
                            {!thread.synced && (
                              <Badge variant="outline" className="text-xs py-0 px-1">
                                <Clock className="h-2 w-2 mr-1" />
                                <span className="hidden sm:inline">Pending sync</span>
                                <span className="sm:hidden">Sync</span>
                              </Badge>
                            )}
                          </div>
                          <h2 className="text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors mb-2 break-words line-clamp-2">
                            {thread.title}
                          </h2>
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2 break-words">
                            {thread.excerpt}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              {thread.replies} replies
                            </span>
                            <span className="break-words">Last active: {thread.lastActive}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}