'use client'

import { motion } from 'framer-motion'
import { Trophy, Star } from 'lucide-react'
import { ProgressBar } from './progress-bar'
import { cn } from '@/lib/utils'

interface LevelProgressProps {
  level: number
  currentPoints: number
  pointsForNextLevel: number
  progressToNextLevel: number
  className?: string
}

export function LevelProgress({ 
  level, 
  currentPoints, 
  pointsForNextLevel, 
  progressToNextLevel,
  className 
}: LevelProgressProps) {
  const pointsNeeded = pointsForNextLevel - currentPoints

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 overflow-hidden box-border', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
            {level}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
              Level {level}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">
              {pointsNeeded > 0 ? `${pointsNeeded} points to level ${level + 1}` : 'Max level reached!'}
            </p>
          </div>
        </div>
        
        <div className="text-left sm:text-right flex-shrink-0 ml-10 sm:ml-0">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Progress</div>
          <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
            {Math.round(progressToNextLevel)}%
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <ProgressBar 
          progress={progressToNextLevel} 
          color="purple"
          showPercentage={false}
          className="mb-2"
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
        <span className="truncate">{currentPoints.toLocaleString()} XP</span>
        <span className="truncate">{pointsForNextLevel.toLocaleString()} XP</span>
      </div>
    </div>
  )
}

interface LevelUpAnimationProps {
  newLevel: number
  onComplete?: () => void
}

export function LevelUpAnimation({ newLevel, onComplete }: LevelUpAnimationProps) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onComplete}
    >
      <motion.div
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white text-center max-w-md mx-4"
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <motion.div
          className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Trophy className="w-10 h-10 text-yellow-800" />
        </motion.div>
        
        <h2 className="text-2xl font-bold mb-2">Level Up!</h2>
        <p className="text-lg mb-4">You&apos;ve reached Level {newLevel}!</p>
        
        <div className="flex justify-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Star className="w-6 h-6 text-yellow-400 fill-current" />
            </motion.div>
          ))}
        </div>
        
        <button
          onClick={onComplete}
          className="bg-white text-purple-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
        >
          Continue Learning
        </button>
      </motion.div>
    </motion.div>
  )
}