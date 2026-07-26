'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { QuizDashboard } from '@/components/quiz/quiz-dashboard'
import { Navigation } from '@/components/navigation'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function QuizPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentPage] = useState('quiz')

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    redirect('/login')
  }

  const handleNavigate = (page: string) => {
    if (page === 'student-dashboard') {
      router.push('/student-dashboard')
    } else if (page === 'teacher-dashboard') {
      router.push('/teacher-dashboard')
    } else if (page === 'landing') {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 break-words">
              AI Quiz Generator
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Create and take AI-generated quizzes on any topic to test your knowledge and earn points!
            </p>
          </div>

          <Suspense fallback={<div>Loading...</div>}>
            <QuizDashboard />
          </Suspense>
        </div>
      </div>
    </div>
  )
}