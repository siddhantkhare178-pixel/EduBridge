'use client'

import { useSession } from 'next-auth/react'
import { redirect } from "next/navigation"
import { RevisionInterface } from "@/components/revision/revision-interface"
import { Navigation } from '@/components/navigation'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RevisionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentPage] = useState('revision')

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session?.user?.id) redirect("/login")
  const role = (session.user as any).role
  if (role === "TEACHER") redirect("/teacher")
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
    <div className="min-h-screen bg-background">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      <RevisionInterface />
    </div>
  )
}