'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2, Brain, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface QuizCreatorProps {
  onQuizCreated: (quizId: string) => void
}

export function QuizCreator({ onQuizCreated }: QuizCreatorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    questionCount: 5,
    isPublic: false
  })

  const handleGenerateQuiz = async () => {
    if (!formData.title || !formData.topic) {
      toast.error('Please fill in title and topic')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to generate quiz')

      const { quizId } = await response.json()
      toast.success('Quiz generated successfully!')
      onQuizCreated(quizId)
    } catch (error) {
      toast.error('Failed to generate quiz')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600" />
          Create AI-Generated Quiz
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Quiz Title</label>
            <Input
              placeholder="e.g., JavaScript Fundamentals"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Topic</label>
            <Input
              placeholder="e.g., React Hooks, Python Basics"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description (Optional)</label>
          <Textarea
            placeholder="Brief description of what this quiz covers..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty</label>
            <Select
              value={formData.difficulty}
              onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                setFormData(prev => ({ ...prev, difficulty: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">
                  <div className="flex items-center gap-2">
                    <Badge className={difficultyColors.easy}>Easy</Badge>
                    <span className="text-sm">5 pts per question</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <Badge className={difficultyColors.medium}>Medium</Badge>
                    <span className="text-sm">10 pts per question</span>
                  </div>
                </SelectItem>
                <SelectItem value="hard">
                  <div className="flex items-center gap-2">
                    <Badge className={difficultyColors.hard}>Hard</Badge>
                    <span className="text-sm">15 pts per question</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Questions</label>
            <Select
              value={formData.questionCount.toString()}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, questionCount: parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 5, 10, 15, 20].map(count => (
                  <SelectItem key={count} value={count.toString()}>
                    {count} questions
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Visibility</label>
            <Select
              value={formData.isPublic ? 'public' : 'private'}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, isPublic: value === 'public' }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                AI-Powered Quiz Generation
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Our AI will generate {formData.questionCount} {formData.difficulty} level questions about &quot;{formData.topic || 'your topic'}&quot; 
                with multiple choice answers and explanations.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleGenerateQuiz}
            disabled={isGenerating || !formData.title || !formData.topic}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Quiz with AI
              </>
            )}
          </Button>

        </div>
      </CardContent>
    </Card>
  )
}