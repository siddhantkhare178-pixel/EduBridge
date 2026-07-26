"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Brain,
  Flame,
  BarChart3,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Lightbulb,
  Volume2,
  VolumeX
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface RevisionSession {
  id: string
  topic: string
  score: number
  duration: number
  method: string
  explanation: string
  feedback: {
    overallScore: number
    correctConcepts: string[]
    missingConcepts: string[]
    incorrectConcepts: string[]
    suggestions: string[]
    encouragement: string
  }
  createdAt: string
  course: {
    title: string
    createdBy: {
      name: string
    }
  }
}

interface RevisionStats {
  totalSessions: number
  averageScore: number
  totalTimeSpent: number
}

interface RevisionStreak {
  current: number
  longest: number
  lastRevision: string | null
}

interface RevisionHistoryProps {
  onClose: () => void
}

export function RevisionHistory({ onClose }: RevisionHistoryProps) {
  const [sessions, setSessions] = useState<RevisionSession[]>([])
  const [stats, setStats] = useState<RevisionStats | null>(null)
  const [streak, setStreak] = useState<RevisionStreak | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<RevisionSession | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const response = await fetch("/api/revision/history")
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
        setStats(data.stats)
        setStreak(data.streak)
      }
    } catch (error) {
      console.error("Error loading revision history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 0.8
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      window.speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const handleSessionClick = (session: RevisionSession) => {
    setSelectedSession(session)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show detailed session view
  if (selectedSession) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSession(null)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to History
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{selectedSession.topic}</h1>
                <p className="text-muted-foreground">
                  {selectedSession.course.title} • {formatDistanceToNow(new Date(selectedSession.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Session Info */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Session Details
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant={getScoreBadgeVariant(selectedSession.score)}>
                    {selectedSession.score}%
                  </Badge>
                  <Badge variant="outline">
                    {selectedSession.method === "voice" ? "🎤 Voice" : "✏️ Text"}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{selectedSession.score}%</div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{formatDuration(selectedSession.duration)}</div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{selectedSession.method === "voice" ? "Voice" : "Text"}</div>
                  <div className="text-sm text-muted-foreground">Input Method</div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Your Explanation:</h4>
                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                  {selectedSession.explanation}
                </div>
              </div>
            </Card>

            {/* AI Feedback */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Feedback
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isSpeaking ? stopSpeaking : () => speakText(selectedSession.feedback.encouragement)}
                  className="gap-2"
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {isSpeaking ? "Stop" : "Listen"}
                </Button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1">
                    <Progress value={selectedSession.feedback.overallScore} className="h-3" />
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {selectedSession.feedback.overallScore}%
                  </span>
                </div>
                <p className="text-muted-foreground">{selectedSession.feedback.encouragement}</p>
              </div>

              {/* Detailed Feedback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Correct Concepts */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    What You Got Right ({selectedSession.feedback.correctConcepts.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.feedback.correctConcepts.map((concept, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Missing Concepts */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-600">
                    <Lightbulb className="w-5 h-5" />
                    Areas to Explore More ({selectedSession.feedback.missingConcepts.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.feedback.missingConcepts.map((concept, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Incorrect Concepts */}
              {selectedSession.feedback.incorrectConcepts.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    Concepts to Review ({selectedSession.feedback.incorrectConcepts.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.feedback.incorrectConcepts.map((concept, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Suggestions for Improvement
                </h4>
                <ul className="space-y-3">
                  {selectedSession.feedback.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button onClick={() => setSelectedSession(null)} variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to History
              </Button>
              <Button onClick={onClose} className="gap-2">
                <Brain className="w-4 h-4" />
                New Revision Session
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Revision History</h1>
              <p className="text-muted-foreground">Track your learning progress</p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            Back to Revision
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && streak && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Spent</p>
                  <p className="text-2xl font-bold">{formatDuration(stats.totalTimeSpent)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <Flame className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">{streak.current} days</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Recent Sessions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Sessions
          </h3>
          
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No revision sessions yet. Start your first session!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleSessionClick(session)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{session.topic}</h4>
                      <Badge variant={getScoreBadgeVariant(session.score)}>
                        {session.score}%
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {session.method === "voice" ? "🎤 Voice" : "✏️ Text"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {session.course.title} • {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(session.duration)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(session.score)}`}>
                        {session.score}%
                      </div>
                      <Progress value={session.score} className="w-16 h-2" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}