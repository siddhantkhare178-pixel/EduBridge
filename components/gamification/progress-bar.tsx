'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  progress: number
  className?: string
  showPercentage?: boolean
  animated?: boolean
  color?: 'blue' | 'green' | 'purple' | 'orange'
}

export function ProgressBar({ 
  progress, 
  className, 
  showPercentage = true, 
  animated = true,
  color = 'blue' 
}: ProgressBarProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500', 
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  }

  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className={cn('w-full', className)}>
      {showPercentage && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
      <div className="relative w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
        {animated ? (
          <motion.div
            className={cn('absolute top-0 left-0 h-full rounded-full', colorClasses[color])}
            initial={{ width: 0 }}
            animate={{ width: `${clampedProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ maxWidth: '100%' }}
          />
        ) : (
          <div
            className={cn('absolute top-0 left-0 h-full rounded-full', colorClasses[color])}
            style={{ width: `${clampedProgress}%`, maxWidth: '100%' }}
          />
        )}
      </div>
    </div>
  )
}