'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, Clock, Trophy, Brain } from 'lucide-react'
import { toast } from 'sonner'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  points: number
}

interface Quiz {
  id: string
  title: string
  description: string | null
  difficulty: string
  questions: QuizQuestion[]
}

interface QuizPlayerProps {
  quiz: Quiz
  onComplete: (score: number, totalPoints: number, answers: any[], timeSpent: number) => void
}

export function QuizPlayer({ quiz, onComplete }: QuizPlayerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  const [startTime] = useState(() => performance.now())

  useEffect(() => {
    if (isCompleted) return // Don't start timer if already completed

    const timer = setInterval(() => {
      if (!isCompleted) {
        const currentTime = performance.now()
        setTimeSpent(Math.floor((currentTime - startTime) / 1000))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime, isCompleted])

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return

    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
    setShowExplanation(true)

    // Auto advance after showing explanation
    setTimeout(() => {
      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(prev => prev + 1)
        setShowExplanation(false)
      } else {
        completeQuiz(newAnswers)
      }
    }, 3000)
  }

  const completeQuiz = useCallback((answers: number[]) => {
    // Calculate final time before setting completion state
    const currentTime = performance.now()
    const finalTimeSpent = Math.floor((currentTime - startTime) / 1000)
    
    setTimeSpent(finalTimeSpent)
    setIsCompleted(true)
    
    // Ensure all answers are defined (fill missing with -1 for unanswered)
    const completeAnswers = quiz.questions.map((_, index) => 
      answers[index] !== undefined ? answers[index] : -1
    )
    
    let score = 0
    let totalPoints = 0
    
    quiz.questions.forEach((question, index) => {
      totalPoints += question.points
      if (completeAnswers[index] === question.correctAnswer) {
        score += question.points
      }
    })

    onComplete(score, totalPoints, completeAnswers, finalTimeSpent)
  }, [startTime, quiz.questions, onComplete])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((currentQuestion + (showExplanation ? 1 : 0)) / quiz.questions.length) * 100

  if (isCompleted) {
    const score = selectedAnswers.reduce((acc, answer, index) => {
      return acc + (answer === quiz.questions[index].correctAnswer ? quiz.questions[index].points : 0)
    }, 0)
    const totalPoints = quiz.questions.reduce((acc, q) => acc + q.points, 0)
    const percentage = Math.round((score / totalPoints) * 100)

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {score}/{totalPoints}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Points Earned</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {percentage}%
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Accuracy</div>
              </div>
            </div>

            <div className="flex justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Time: {formatTime(timeSpent)}
              </div>
              <div className="flex items-center gap-1">
                <Brain className="w-4 h-4" />
                {quiz.questions.length} Questions
              </div>
            </div>

            <Button onClick={() => window.location.reload()} className="w-full">
              Take Another Quiz
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const question = quiz.questions[currentQuestion]
  const isCorrect = showExplanation && selectedAnswers[currentQuestion] === question.correctAnswer

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">{quiz.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                {formatTime(timeSpent)}
              </div>
              <Badge variant="outline">{question.points} points</Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed">
                {question.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {question.options.map((option, index) => {
                let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 "
                
                if (showExplanation) {
                  if (index === question.correctAnswer) {
                    buttonClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                  } else if (index === selectedAnswers[currentQuestion] && index !== question.correctAnswer) {
                    buttonClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                  } else {
                    buttonClass += "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                  }
                } else {
                  buttonClass += "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showExplanation}
                    className={buttonClass}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span>{option}</span>
                      {showExplanation && index === question.correctAnswer && (
                        <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                      )}
                      {showExplanation && index === selectedAnswers[currentQuestion] && index !== question.correctAnswer && (
                        <XCircle className="w-5 h-5 text-red-500 ml-auto" />
                      )}
                    </div>
                  </button>
                )
              })}

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && question.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-start gap-2">
                      <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Explanation
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {question.explanation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}