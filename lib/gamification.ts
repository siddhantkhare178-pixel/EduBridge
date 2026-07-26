import { prisma } from '@/lib/prisma'

export interface PointsConfig {
  LESSON_COMPLETION: number
  QUIZ_COMPLETION: number
  PERFECT_QUIZ_SCORE: number
  DAILY_LOGIN: number
  STREAK_BONUS: number
}

export const POINTS: PointsConfig = {
  LESSON_COMPLETION: 50,
  QUIZ_COMPLETION: 30,
  PERFECT_QUIZ_SCORE: 50,
  DAILY_LOGIN: 10,
  STREAK_BONUS: 20,
}

export interface AchievementType {
  id: string
  title: string
  description: string
  points: number
  iconUrl?: string
  condition: (user: any, context?: any) => boolean
}

export const ACHIEVEMENTS: AchievementType[] = [
  {
    id: 'first_lesson',
    title: 'First Steps',
    description: 'Complete your first lesson',
    points: 100,
    iconUrl: '🎯',
    condition: (user) => user.progresses?.length >= 1
  },
  {
    id: 'week_streak',
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    points: 200,
    iconUrl: '🔥',
    condition: (user) => user.currentStreak >= 7
  },
  {
    id: 'quiz_master',
    title: 'Quiz Master',
    description: 'Complete 10 quizzes',
    points: 300,
    iconUrl: '🧠',
    condition: (user) => user.quizAttempts?.filter((a: any) => a.completed).length >= 10
  },
  {
    id: 'perfect_score',
    title: 'Perfectionist',
    description: 'Get 100% on a quiz',
    points: 150,
    iconUrl: '⭐',
    condition: (user, context) => context?.score === context?.totalPoints
  },
  {
    id: 'level_up_5',
    title: 'Rising Star',
    description: 'Reach level 5',
    points: 250,
    iconUrl: '🌟',
    condition: (user) => user.level >= 5
  }
]

export class GamificationService {
  static async awardPoints(userId: string, points: number, reason: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: {
          increment: points
        }
      }
    })

    // Check for level up
    const newLevel = this.calculateLevel(user.totalPoints)
    if (newLevel > user.level) {
      await prisma.user.update({
        where: { id: userId },
        data: { level: newLevel }
      })
    }

    return { points, newLevel }
  }

  static calculateLevel(totalPoints: number): number {
    // Level formula: level = floor(sqrt(totalPoints / 100)) + 1
    return Math.floor(Math.sqrt(totalPoints / 100)) + 1
  }

  static getPointsForNextLevel(currentLevel: number): number {
    return Math.pow(currentLevel, 2) * 100
  }

  static async updateStreak(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const lastActivity = user.lastActivityDate
    const isConsecutiveDay = lastActivity && 
      new Date(lastActivity).getTime() === today.getTime() - 24 * 60 * 60 * 1000

    let newStreak = 1
    if (isConsecutiveDay) {
      newStreak = user.currentStreak + 1
    }

    const longestStreak = Math.max(user.longestStreak, newStreak)

    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate: new Date()
      }
    })

    // Award streak bonus
    if (newStreak > 1) {
      await this.awardPoints(userId, POINTS.STREAK_BONUS, `${newStreak}-day streak bonus`)
    }

    return { currentStreak: newStreak, longestStreak }
  }

  static async checkAndAwardAchievements(userId: string, context?: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        progresses: true,
        quizAttempts: true,
        achievements: true
      }
    })

    if (!user) return []

    const existingAchievements = user.achievements.map(a => a.type)
    const newAchievements = []

    for (const achievement of ACHIEVEMENTS) {
      if (!existingAchievements.includes(achievement.id) && 
          achievement.condition(user, context)) {
        
        const newAchievement = await prisma.achievement.create({
          data: {
            userId,
            type: achievement.id,
            title: achievement.title,
            description: achievement.description,
            points: achievement.points,
            iconUrl: achievement.iconUrl
          }
        })

        await this.awardPoints(userId, achievement.points, `Achievement: ${achievement.title}`)
        newAchievements.push(newAchievement)
      }
    }

    return newAchievements
  }

  static async getUserStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: true,
        progresses: {
          where: { percent: 100 }
        },
        quizAttempts: {
          where: { completed: true }
        }
      }
    })

    if (!user) return null

    const pointsForNextLevel = this.getPointsForNextLevel(user.level)
    const pointsInCurrentLevel = user.totalPoints - Math.pow(user.level - 1, 2) * 100

    return {
      totalPoints: user.totalPoints,
      level: user.level,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      achievements: user.achievements,
      completedLessons: user.progresses.length,
      completedQuizzes: user.quizAttempts.length,
      pointsForNextLevel,
      pointsInCurrentLevel,
      progressToNextLevel: (pointsInCurrentLevel / (pointsForNextLevel - Math.pow(user.level - 1, 2) * 100)) * 100
    }
  }
}