import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== "TEACHER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
        // Get teacher's courses with enrollments and progress data
        const courses = await prisma.course.findMany({
            where: { createdById: session.user.id },
            include: {
                enrollments: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                },
                lessons: {
                    include: {
                        progress: {
                            include: {
                                user: {
                                    select: { id: true, name: true }
                                }
                            }
                        }
                    }
                },
                threads: {
                    include: {
                        author: {
                            select: { id: true, name: true }
                        },
                        replies: {
                            include: {
                                author: {
                                    select: { id: true, name: true }
                                }
                            }
                        }
                    }
                }
            }
        })

        // Calculate engagement data (last 7 days)
        const now = new Date()
        const engagementData = []
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

        // Get all teacher's course IDs for efficient querying
        const teacherCourseIds = courses.map(course => course.id)

        if (teacherCourseIds.length === 0) {
            // No courses, return empty engagement data
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
                engagementData.push({
                    day: days[date.getDay()],
                    active: 0,
                    completed: 0
                })
            }
        } else {
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
                const dayStart = new Date(date.setHours(0, 0, 0, 0))
                const dayEnd = new Date(date.setHours(23, 59, 59, 999))

                // Get unique active students for the day
                const activeStudentsData = await prisma.progress.findMany({
                    where: {
                        updatedAt: {
                            gte: dayStart,
                            lte: dayEnd
                        },
                        lesson: {
                            courseId: {
                                in: teacherCourseIds
                            }
                        }
                    },
                    select: {
                        userId: true
                    },
                    distinct: ['userId']
                })

                // Count completed lessons
                const completedLessons = await prisma.progress.count({
                    where: {
                        completedAt: {
                            gte: dayStart,
                            lte: dayEnd
                        },
                        lesson: {
                            courseId: {
                                in: teacherCourseIds
                            }
                        }
                    }
                })

                engagementData.push({
                    day: days[date.getDay()],
                    active: activeStudentsData.length,
                    completed: completedLessons
                })
            }
        }

        // Calculate assessment performance (using progress as proxy for assessments)
        const assessmentData = []
        for (const course of courses) {
            if (course.lessons.length === 0) continue

            const totalProgress = course.lessons.reduce((sum, lesson) => {
                const avgProgress = lesson.progress.length > 0
                    ? lesson.progress.reduce((s, p) => s + p.percent, 0) / lesson.progress.length
                    : 0
                return sum + avgProgress
            }, 0)

            const avgScore = course.lessons.length > 0 ? Math.round(totalProgress / course.lessons.length) : 0

            assessmentData.push({
                name: course.title.length > 15 ? course.title.substring(0, 15) + '...' : course.title,
                score: avgScore
            })
        }

        // Get recent student activities
        const recentActivities = []

        if (teacherCourseIds.length > 0) {
            // Recent progress updates
            const recentProgress = await prisma.progress.findMany({
                where: {
                    lesson: {
                        courseId: {
                            in: teacherCourseIds
                        }
                    },
                    updatedAt: {
                        gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    }
                },
                include: {
                    user: {
                        select: { name: true }
                    },
                    lesson: {
                        include: {
                            course: {
                                select: { title: true }
                            }
                        }
                    }
                },
                orderBy: { updatedAt: 'desc' },
                take: 10
            })

            for (const progress of recentProgress) {
                const timeAgo = getTimeAgo(progress.updatedAt)
                const lessonTitle = progress.lesson.title.length > 30
                    ? progress.lesson.title.substring(0, 30) + '...'
                    : progress.lesson.title
                const action = progress.percent === 100
                    ? `Completed "${lessonTitle}" in ${progress.lesson.course.title}`
                    : `Updated progress on "${lessonTitle}" (${progress.percent}%)`

                recentActivities.push({
                    student: progress.user.name || 'Anonymous Student',
                    action,
                    time: timeAgo,
                    type: progress.percent === 100 ? 'completion' : 'progress'
                })
            }

            // Recent forum activities
            const recentThreads = await prisma.thread.findMany({
                where: {
                    courseId: {
                        in: teacherCourseIds
                    },
                    createdAt: {
                        gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    }
                },
                include: {
                    author: {
                        select: { name: true }
                    },
                    course: {
                        select: { title: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            })

            for (const thread of recentThreads) {
                const timeAgo = getTimeAgo(thread.createdAt)
                const threadTitle = thread.title.length > 40
                    ? thread.title.substring(0, 40) + '...'
                    : thread.title
                recentActivities.push({
                    student: thread.author.name || 'Anonymous Student',
                    action: `Asked: "${threadTitle}" in ${thread.course?.title}`,
                    time: timeAgo,
                    type: 'forum'
                })
            }

            // Sort activities by most recent
            recentActivities.sort((a, b) => {
                const timeA = parseTimeAgo(a.time)
                const timeB = parseTimeAgo(b.time)
                return timeA - timeB
            })
        }

        const response = {
            engagementData: engagementData.slice(-7), // Last 7 days
            assessmentData: assessmentData.slice(0, 5), // Top 5 courses
            activities: recentActivities.slice(0, 8), // Most recent 8 activities
            summary: {
                totalStudents: courses.reduce((sum, course) => sum + course.enrollments.length, 0),
                totalCourses: courses.length,
                activeCourses: courses.filter(course => course.status === 'published').length,
                totalLessons: courses.reduce((sum, course) => sum + course.lessons.length, 0),
                totalForumPosts: courses.reduce((sum, course) => sum + course.threads.length, 0)
            }
        }

        return NextResponse.json(response)

    } catch (error) {
        console.error("Error fetching teacher analytics:", error)
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
    }
}

function getTimeAgo(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
        return diffMins <= 1 ? "1 minute ago" : `${diffMins} minutes ago`
    } else if (diffHours < 24) {
        return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`
    } else {
        return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`
    }
}

function parseTimeAgo(timeStr: string): number {
    const match = timeStr.match(/(\d+)\s+(minute|hour|day)s?\s+ago/)
    if (!match) return 0

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
        case 'minute': return value
        case 'hour': return value * 60
        case 'day': return value * 60 * 24
        default: return 0
    }
}