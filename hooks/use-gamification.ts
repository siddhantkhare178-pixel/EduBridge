'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface GamificationStats {
  totalPoints: number
  level: number
  currentStreak: number
  longestStreak: number
  achievements: any[]
  completedLessons: number
  completedQuizzes: number
  pointsForNextLevel: number
  pointsInCurrentLevel: number
  progressToNextLevel: number
}

export function useGamification() {
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/gamification/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching gamification stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const awardPoints = async (points: number, reason: string) => {
    try {
      const response = await fetch('/api/gamification/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'award_points',
          points,
          context: { reason }
        })
      })

      if (response.ok) {
        const result = await response.json()
        await fetchStats() // Refresh stats
        
        if (result.data?.newLevel > (stats?.level || 1)) {
          toast.success(`Level up! You're now level ${result.data.newLevel}!`)
        }
        
        return result.data
      }
    } catch (error) {
      console.error('Error awarding points:', error)
    }
  }

  const updateStreak = async () => {
    try {
      const response = await fetch('/api/gamification/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_streak'
        })
      })

      if (response.ok) {
        await fetchStats() // Refresh stats
        return true
      }
    } catch (error) {
      console.error('Error updating streak:', error)
    }
    return false
  }

  const checkAchievements = async (context?: any) => {
    try {
      const response = await fetch('/api/gamification/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_achievements',
          context
        })
      })

      if (response.ok) {
        const result = await response.json()
        await fetchStats() // Refresh stats
        
        if (result.data?.length > 0) {
          result.data.forEach((achievement: any) => {
            toast.success(`Achievement unlocked: ${achievement.title}!`)
          })
        }
        
        return result.data
      }
    } catch (error) {
      console.error('Error checking achievements:', error)
    }
    return []
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    fetchStats,
    awardPoints,
    updateStreak,
    checkAchievements
  }
}