'use client'

import { useSession } from 'next-auth/react'
import { redirect } from "next/navigation"
import { RecommendationClient } from "./RecommendationClient"
import { Navigation } from '@/components/navigation'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RecommendationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentPage] = useState('recommendations')

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session?.user?.id) redirect("/login")
  
  const role = (session.user as any).role
  if (role === "TEACHER") redirect("/teacher-dashboard")
  if (role !== "STUDENT") redirect("/onboarding")

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
      <RecommendationClient />
    </div>
  )
}