'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuizPlayer } from './quiz-player'
import { QuizLeaderboard } from './quiz-leaderboard'
import { ArrowLeft, Play, Trophy, Users, Brain, Clock, Target } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Quiz {
  id: string
  title: string
  description: string | null
  topic: string
  difficulty: string
  isPublic: boolean
  createdAt: Date
  createdBy: {
    name: string | null
    image: string | null
  }
  questions: any[]
  _count: {
    attempts: number
  }
}

interface QuizDetailViewProps {
  quiz: Quiz
}

export function QuizDetailView({ quiz }: QuizDetailViewProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const handleQuizComplete = async (score: number, totalPoints: number, answers: any[], timeSpent: number) => {
    try {
      const response = await fetch(`/api/quiz/${quiz.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          totalPoints,
          answers,
          timeSpent
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Quiz completed! +${result.pointsEarned} points earned!`)
        
        if (result.newAchievements?.length > 0) {
          result.newAchievements.forEach((achievement: any) => {
            toast.success(`Achievement unlocked: ${achievement.title}!`)
          })
        }
      }
    } catch (error) {
      console.error('Error saving quiz attempt:', error)
      toast.error('Failed to save quiz results')
    }

    setIsPlaying(false)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (isPlaying) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setIsPlaying(false)}
          >
            ← Back to Quiz Details
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{quiz.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {quiz.questions.length} questions • {quiz.difficulty} difficulty
            </p>
          </div>
        </div>
        
        <QuizPlayer 
          quiz={quiz} 
          onComplete={handleQuizComplete}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/quiz">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quizzes
          </Button>
        </Link>
      </div>

      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {quiz.title}
                </h1>
                <Badge className={getDifficultyColor(quiz.difficulty)}>
                  {quiz.difficulty}
                </Badge>
                {quiz.isPublic && (
                  <Badge variant="outline">Public</Badge>
                )}
              </div>
              
              {quiz.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {quiz.description}
                </p>
              )}
              
              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  <span>{quiz.questions.length} questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>Topic: {quiz.topic}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{quiz._count.attempts} attempts</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>by {quiz.createdBy.name}</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => setIsPlaying(true)}
              size="lg"
              className="gap-2"
            >
              <Play className="w-5 h-5" />
              Take Quiz
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs for Leaderboard and Info */}
      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leaderboard">
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="questions">
            <Brain className="w-4 h-4 mr-2" />
            Questions Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <QuizLeaderboard quizId={quiz.id} quizTitle={quiz.title} />
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Questions Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quiz.questions.map((question, index) => (
                  <div 
                    key={question.id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {index + 1}. {question.question}
                      </h3>
                      <Badge variant="outline">
                        {question.points} pts
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {question.options.map((option: string, optionIndex: number) => (
                        <div 
                          key={optionIndex}
                          className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300"
                        >
                          {String.fromCharCode(65 + optionIndex)}. {option}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}