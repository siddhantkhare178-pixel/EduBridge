import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { courseId, topic, explanation, score, feedback, duration, method } = await request.json()
    
    console.log("Received revision save request:", {
      userId: session.user.id,
      courseId,
      topic,
      score,
      duration,
      method
    })

    if (!courseId || !topic || !explanation || score === undefined) {
      console.log("Missing required fields:", { courseId, topic, explanation: !!explanation, score })
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Save revision session
    const revisionSession = await prisma.revisionSession.create({
      data: {
        userId: session.user.id,
        courseId,
        topic,
        explanation,
        score,
        feedback,
        duration: duration || 0,
        method: method || "text"
      }
    })

    // Update revision streak
    await updateRevisionStreak(session.user.id)

    // Award points for revision
    const pointsEarned = Math.max(10, Math.floor(score / 10) * 5)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totalPoints: {
          increment: pointsEarned
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      sessionId: revisionSession.id,
      pointsEarned 
    })
  } catch (error) {
    console.error("Error saving revision session:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function updateRevisionStreak(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let streak = await prisma.revisionStreak.findUnique({
    where: { userId }
  })

  if (!streak) {
    // Create new streak
    streak = await prisma.revisionStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastRevisionDate: new Date()
      }
    })
  } else {
    const lastRevision = streak.lastRevisionDate
    const lastRevisionDate = lastRevision ? new Date(lastRevision) : null
    
    if (lastRevisionDate) {
      lastRevisionDate.setHours(0, 0, 0, 0)
      
      if (lastRevisionDate.getTime() === yesterday.getTime()) {
        // Continue streak
        const newStreak = streak.currentStreak + 1
        await prisma.revisionStreak.update({
          where: { userId },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(streak.longestStreak, newStreak),
            lastRevisionDate: new Date()
          }
        })
      } else if (lastRevisionDate.getTime() !== today.getTime()) {
        // Reset streak
        await prisma.revisionStreak.update({
          where: { userId },
          data: {
            currentStreak: 1,
            lastRevisionDate: new Date()
          }
        })
      }
      // If lastRevisionDate === today, do nothing (already revised today)
    }
  }
}