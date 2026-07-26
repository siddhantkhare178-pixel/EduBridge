'use client'

import { motion } from 'framer-motion'
import { Award, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Achievement {
  id: string
  type: string
  title: string
  description: string
  points: number
  iconUrl?: string
  createdAt: Date
}

interface AchievementBadgeProps {
  achievement: Achievement
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showPoints?: boolean
}

export function AchievementBadge({ 
  achievement, 
  className, 
  size = 'md',
  showPoints = true 
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-xs',
    md: 'w-16 h-16 text-sm', 
    lg: 'w-20 h-20 text-base'
  }

  return (
    <motion.div
      className={cn(
        'relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg',
        sizeClasses[size],
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`${achievement.title}: ${achievement.description}`}
    >
      {achievement.iconUrl ? (
        <span className="text-2xl">{achievement.iconUrl}</span>
      ) : (
        <Award className="w-1/2 h-1/2" />
      )}
      
      {showPoints && (
        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
          {achievement.points}
        </div>
      )}
    </motion.div>
  )
}

interface AchievementNotificationProps {
  achievement: Achievement
  onClose: () => void
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  return (
    <motion.div
      className="fixed top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-sm z-50 border border-yellow-200 dark:border-yellow-800"
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.4, type: 'spring' }}
    >
      <div className="flex items-start gap-3">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full w-12 h-12 flex items-center justify-center text-white">
          {achievement.iconUrl ? (
            <span className="text-xl">{achievement.iconUrl}</span>
          ) : (
            <Award className="w-6 h-6" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Achievement Unlocked!
            </span>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">
            {achievement.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {achievement.description}
          </p>
          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
            +{achievement.points} points earned!
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ×
        </button>
      </div>
    </motion.div>
  )
}