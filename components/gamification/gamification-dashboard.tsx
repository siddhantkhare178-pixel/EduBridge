'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PointsDisplay } from './points-display'
import { StreakCounter } from './streak-counter'
import { LevelProgress } from './level-progress'
import { AchievementBadge } from './achievement-badge'
import { Trophy, Target, Zap, Award } from 'lucide-react'

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

export function GamificationDashboard() {
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

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

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 sm:p-6">
              <div className="h-16 sm:h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Failed to load gamification stats
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PointsDisplay 
            points={stats.totalPoints} 
            level={stats.level}
            variant="detailed"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StreakCounter 
            currentStreak={stats.currentStreak}
            longestStreak={stats.longestStreak}
            variant="detailed"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm opacity-90">Lessons</span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold">{stats.completedLessons}</div>
                </div>
                <div className="text-right min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 justify-end">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm opacity-90">Quizzes</span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold">{stats.completedQuizzes}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-pink-500 to-rose-600 text-white">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm opacity-90">Achievements</span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold">{stats.achievements.length}</div>
                </div>
                <Award className="w-6 h-6 sm:w-8 sm:h-8 opacity-50 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Level Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <LevelProgress
          level={stats.level}
          currentPoints={stats.pointsInCurrentLevel}
          pointsForNextLevel={stats.pointsForNextLevel}
          progressToNextLevel={stats.progressToNextLevel}
        />
      </motion.div>

      {/* Achievements */}
      {stats.achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" />
                <span>Recent Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2 sm:gap-4">
                {stats.achievements.slice(0, 8).map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <AchievementBadge 
                      achievement={achievement}
                      size="lg"
                    />
                  </motion.div>
                ))}
              </div>
              
              {stats.achievements.length > 8 && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3 sm:mt-4">
                  +{stats.achievements.length - 8} more achievements
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}