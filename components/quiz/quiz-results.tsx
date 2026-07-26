'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, Clock, Target, Calendar, Eye } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface QuizAttempt {
  id: string
  score: number
  totalPoints: number
  timeSpent: number
  completed: boolean
  createdAt: string
  quiz: {
    id: string
    title: string
    topic: string
    difficulty: string
    questions: any[]
  }
}

export function QuizResults() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttempts()
  }, [])

  const fetchAttempts = async () => {
    try {
      const response = await fetch('/api/quiz/attempts')
      if (response.ok) {
        const data = await response.json()
        setAttempts(data)
      }
    } catch (error) {
      console.error('Error fetching quiz attempts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 90) return 'text-green-600 dark:text-green-400'
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3 sm:p-6">
              <div className="h-16 sm:h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (attempts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No quiz attempts yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            Take your first quiz to see your results here!
          </p>
          <Link href="/quiz">
            <Button>Take a Quiz</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Calculate stats
  const totalAttempts = attempts.length
  const averageScore = attempts.reduce((acc, attempt) => 
    acc + (attempt.score / attempt.totalPoints) * 100, 0) / totalAttempts
  const bestScore = Math.max(...attempts.map(attempt => 
    (attempt.score / attempt.totalPoints) * 100))
  const totalTimeSpent = attempts.reduce((acc, attempt) => acc + attempt.timeSpent, 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/quiz">
          <Button variant="outline" size="sm" className="text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Quizzes</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Attempts
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {totalAttempts}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Average Score
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(averageScore)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Best Score
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(bestScore)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Time Spent
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {formatTime(totalTimeSpent)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Attempts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Recent Quiz Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {attempts.map((attempt, index) => (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base break-words">
                        {attempt.quiz.title}
                      </h3>
                      <div className="flex gap-2">
                        <Badge className={`${getDifficultyColor(attempt.quiz.difficulty)} text-xs`}>
                          {attempt.quiz.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {attempt.quiz.topic}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">Score:</span>
                        <span className={`font-medium ${getScoreColor(attempt.score, attempt.totalPoints)} break-all`}>
                          {attempt.score}/{attempt.totalPoints} ({Math.round((attempt.score / attempt.totalPoints) * 100)}%)
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">Time:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatTime(attempt.timeSpent)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">Questions:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {attempt.quiz.questions.length}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">Date:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {format(new Date(attempt.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/quiz/${attempt.quiz.id}`, '_blank')}
                      className="text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Retake
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}