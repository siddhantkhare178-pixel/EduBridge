import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { QuizDetailView } from '@/components/quiz/quiz-detail-view'

interface QuizPageProps {
  params: Promise<{ id: string }>
}

export default async function QuizPage({ params }: QuizPageProps) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const { id } = await params

  // Fetch quiz data
  const quiz = await prisma.customQuiz.findUnique({
    where: { id },
    include: {
      questions: true,
      createdBy: {
        select: { name: true, image: true }
      },
      _count: {
        select: { attempts: true }
      }
    }
  })

  if (!quiz) {
    redirect('/quiz')
  }

  // Check access permissions
  if (!quiz.isPublic && quiz.createdById !== session.user.id) {
    redirect('/quiz')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <Suspense fallback={<div>Loading quiz...</div>}>
          <QuizDetailView quiz={quiz} />
        </Suspense>
      </div>
    </div>
  )
}