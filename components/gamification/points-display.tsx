'use client'

import { motion } from 'framer-motion'
import { Trophy, Zap, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PointsDisplayProps {
  points: number
  level: number
  className?: string
  showAnimation?: boolean
  variant?: 'compact' | 'detailed'
}

export function PointsDisplay({ 
  points, 
  level, 
  className, 
  showAnimation = true,
  variant = 'compact' 
}: PointsDisplayProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1 sm:gap-2', className)}>
        <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
          <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-yellow-700 dark:text-yellow-300">
            {points.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/20 px-2 py-1 rounded-full">
          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">
            Lv. {level}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-3 sm:p-4 text-white', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 mb-1">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm opacity-90">Total Points</span>
          </div>
          {showAnimation ? (
            <motion.div
              className="text-lg sm:text-2xl font-bold"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {points.toLocaleString()}
            </motion.div>
          ) : (
            <div className="text-lg sm:text-2xl font-bold">{points.toLocaleString()}</div>
          )}
        </div>
        <div className="text-right min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 justify-end">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm opacity-90">Level</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold">{level}</div>
        </div>
      </div>
    </div>
  )
}

interface PointsAnimationProps {
  points: number
  onComplete?: () => void
}

export function PointsAnimation({ points, onComplete }: PointsAnimationProps) {
  return (
    <motion.div
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
      initial={{ opacity: 0, scale: 0.5, y: 0 }}
      animate={{ opacity: 1, scale: 1, y: -50 }}
      exit={{ opacity: 0, scale: 0.5, y: -100 }}
      transition={{ duration: 0.6 }}
      onAnimationComplete={onComplete}
    >
      <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
        <Zap className="w-5 h-5" />
        <span className="font-bold">+{points} points!</span>
      </div>
    </motion.div>
  )
}