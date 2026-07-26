'use client'

import { motion } from 'framer-motion'
import { Flame, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
  className?: string
  variant?: 'compact' | 'detailed'
}

export function StreakCounter({ 
  currentStreak, 
  longestStreak, 
  className,
  variant = 'compact' 
}: StreakCounterProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded-full', className)}>
        <Flame className={cn(
          'w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0',
          currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'
        )} />
        <span className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">
          {currentStreak}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-3 sm:p-4 text-white', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 mb-1">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm opacity-90">Current Streak</span>
          </div>
          <motion.div
            className="text-lg sm:text-2xl font-bold"
            animate={{ scale: currentStreak > 0 ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {currentStreak} days
          </motion.div>
        </div>
        <div className="text-right min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 justify-end">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm opacity-90">Best</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold">{longestStreak} days</div>
        </div>
      </div>
      
      {currentStreak === 0 && (
        <div className="mt-2 text-xs sm:text-sm opacity-75">
          Start learning today to begin your streak! 🔥
        </div>
      )}
    </div>
  )
}