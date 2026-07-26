"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Mic, 
  MicOff, 
  Send, 
  BookOpen, 
  Brain, 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  ArrowLeft,
  Volume2,
  VolumeX,
  History
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RevisionHistory } from "./revision-history"

interface RevisionFeedback {
  overallScore: number
  correctConcepts: string[]
  missingConcepts: string[]
  incorrectConcepts: string[]
  suggestions: string[]
  encouragement: string
}

export function RevisionInterface() {
  const router = useRouter()
  const [selectedTopic, setSelectedTopic] = useState("")
  const [explanation, setExplanation] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<RevisionFeedback | null>(null)
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [microphoneSupported, setMicrophoneSupported] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [wasVoiceInput, setWasVoiceInput] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    loadEnrolledCourses()
    checkMicrophoneSupport()
  }, [])

  const checkMicrophoneSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicrophoneSupported(false)
    }
  }

  const loadEnrolledCourses = async () => {
    try {
      const response = await fetch("/api/enrollments")
      if (response.ok) {
        const data = await response.json()
        setEnrolledCourses(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error loading courses:", error)
    }
  }

  const startRecording = async () => {
    try {
      // Check if browser supports media devices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Your browser doesn&apos;t support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.")
        return
      }

      // Check microphone permission first
      try {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        if (permission.state === 'denied') {
          toast.error("Microphone access denied. Please enable microphone permissions in your browser settings and refresh the page.")
          return
        }
      } catch (permError) {
        // Permission API not supported in all browsers, continue with getUserMedia
        console.log("Permission API not supported, proceeding with getUserMedia")
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        
        // Check if we have audio data
        if (audioBlob.size === 0) {
          toast.error("No audio recorded. Please try again.")
          return
        }
        
        await transcribeAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
        toast.error("Recording error occurred. Please try again.")
        stream.getTracks().forEach(track => track.stop())
        setIsRecording(false)
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      toast.success("🎤 Recording started! Speak clearly about your topic.")
      
    } catch (error: any) {
      console.error("Error starting recording:", error)
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError') {
        toast.error("Microphone access denied. Please click the microphone icon in your browser's address bar and allow access, then try again.")
      } else if (error.name === 'NotFoundError') {
        toast.error("No microphone found. Please connect a microphone and try again.")
      } else if (error.name === 'NotReadableError') {
        toast.error("Microphone is being used by another application. Please close other apps using the microphone and try again.")
      } else if (error.name === 'OverconstrainedError') {
        toast.error("Microphone doesn&apos;t meet the required specifications. Please try with a different microphone.")
      } else {
        toast.error("Could not access microphone. Please check your browser settings and try again.")
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop()
        setIsRecording(false)
        toast.info("🔄 Processing your recording...")
      } catch (error) {
        console.error("Error stopping recording:", error)
        setIsRecording(false)
        toast.error("Error stopping recording. Please try again.")
      }
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob)
      
      const response = await fetch("/api/revision/transcribe", {
        method: "POST",
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        setExplanation(data.transcript)
        setWasVoiceInput(true)
        toast.success("Audio transcribed successfully!")
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Failed to transcribe audio")
      }
    } catch (error) {
      console.error("Error transcribing audio:", error)
      toast.error("Error processing audio. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const submitRevision = async () => {
    if (!selectedTopic || !explanation.trim()) {
      toast.error("Please select a topic and provide your explanation")
      return
    }

    const startTime = Date.now()
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/revision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic,
          explanation: explanation.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setFeedback(data.feedback)
        
        // Save the revision session
        const duration = Math.floor((Date.now() - startTime) / 1000)
        const selectedCourse = enrolledCourses.find(e => e.course?.title === selectedTopic)
        
        if (selectedCourse) {
          try {
            console.log("Saving revision session:", {
              courseId: selectedCourse.course.id,
              topic: selectedTopic,
              score: data.feedback.overallScore
            })
            
            const saveResponse = await fetch("/api/revision/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                courseId: selectedCourse.course.id,
                topic: selectedTopic,
                explanation: explanation.trim(),
                score: data.feedback.overallScore,
                feedback: data.feedback,
                duration,
                method: wasVoiceInput ? "voice" : "text"
              })
            })
            
            if (saveResponse.ok) {
              const saveData = await saveResponse.json()
              console.log("Save response:", saveData)
              if (saveData.pointsEarned > 0) {
                toast.success(`Analysis complete! You earned ${saveData.pointsEarned} points! 🎉`)
              } else {
                toast.success("AI analysis complete!")
              }
            } else {
              const errorData = await saveResponse.json().catch(() => ({}))
              console.error("Save failed:", errorData)
              toast.success("AI analysis complete! (Session not saved)")
            }
          } catch (saveError) {
            console.error("Error saving session:", saveError)
            toast.success("AI analysis complete!")
          }
        } else {
          console.log("No selected course found for saving")
          toast.success("AI analysis complete!")
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Failed to analyze your explanation")
      }
    } catch (error) {
      console.error("Error submitting revision:", error)
      toast.error("Error analyzing explanation")
    } finally {
      setIsLoading(false)
    }
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 0.8
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      window.speechSynthesis.speak(utterance)
    } else {
      toast.error("Text-to-speech not supported in your browser")
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const resetRevision = () => {
    setSelectedTopic("")
    setExplanation("")
    setFeedback(null)
    setIsRecording(false)
    setWasVoiceInput(false)
    if (isSpeaking) stopSpeaking()
  }

  if (showHistory) {
    return <RevisionHistory onClose={() => setShowHistory(false)} />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/student-dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(true)}
              className="gap-2"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex-shrink-0">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">Revision Session</h1>
              <p className="text-sm sm:text-base text-muted-foreground break-words">Explain what you learned and get AI feedback</p>
            </div>
          </div>
        </div>

        {!feedback ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Topic Selection */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="break-words">Select a Topic to Revise</span>
              </h3>
              <div className="grid gap-2 sm:gap-3">
                {enrolledCourses.length > 0 ? (
                  enrolledCourses.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors touch-manipulation ${
                        selectedTopic === enrollment.course?.title
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 active:border-primary/70"
                      }`}
                      onClick={() => setSelectedTopic(enrollment.course?.title || "")}
                    >
                      <h4 className="font-medium text-sm sm:text-base break-words">{enrollment.course?.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">
                        by {enrollment.course?.createdBy?.name}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base mb-3 sm:mb-4">No enrolled courses found. Enroll in a course first!</p>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => router.push("/courses")}
                    >
                      Browse Courses
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Explanation Input */}
            {selectedTopic && (
              <Card className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="break-words">Explain What You Learned</span>
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 break-words">
                  Tell us about &ldquo;{selectedTopic}&rdquo; - what are the key concepts, how does it work, 
                  and what did you find most interesting?
                </p>
                
                {!microphoneSupported && (
                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="p-1 bg-orange-100 dark:bg-orange-900 rounded flex-shrink-0">
                        <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1 text-sm sm:text-base">
                          Voice Recording Not Available
                        </h4>
                        <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-300 mb-1 sm:mb-2 break-words">
                          Your browser doesn&apos;t support voice recording. You can still type your explanation below.
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 break-words">
                          For voice recording, try using Chrome, Firefox, or Safari.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="relative">
                    <Textarea
                      placeholder={isRecording ? "🎤 Recording... Speak clearly about your topic" : "Start typing your explanation here, or use the microphone to record..."}
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      className={`min-h-[150px] sm:min-h-[200px] resize-none text-sm sm:text-base ${isRecording ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : ''}`}
                      disabled={isRecording}
                    />
                    {isRecording && (
                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 sm:gap-2 text-red-600">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs sm:text-sm font-medium">Recording</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={!microphoneSupported || isLoading}
                      className="gap-2 w-full sm:w-auto text-sm"
                      title={!microphoneSupported ? "Microphone not supported in this browser" : ""}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          <span className="hidden sm:inline">Stop Recording</span>
                          <span className="sm:hidden">Stop</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          <span className="hidden sm:inline">{microphoneSupported ? "Record Audio" : "Microphone Not Available"}</span>
                          <span className="sm:hidden">{microphoneSupported ? "Record" : "No Mic"}</span>
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={submitRevision}
                      disabled={!explanation.trim() || isLoading}
                      className="gap-2 w-full sm:w-auto text-sm"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span className="hidden sm:inline">Analyzing...</span>
                          <span className="sm:hidden">Analyzing</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span className="hidden sm:inline">Get Feedback</span>
                          <span className="sm:hidden">Analyze</span>
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {!microphoneSupported && (
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                      Voice recording requires a modern browser. You can still type your explanation.
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        ) : (
          /* Feedback Display */
          <div className="space-y-4 sm:space-y-6">
            {/* Overall Score */}
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="break-words">Your Understanding Score</span>
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isSpeaking ? stopSpeaking : () => speakText(feedback.encouragement)}
                    className="gap-2 text-sm"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {isSpeaking ? "Stop" : "Listen"}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-1">
                  <Progress value={feedback.overallScore} className="h-2 sm:h-3" />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-primary flex-shrink-0">
                  {feedback.overallScore}%
                </span>
              </div>
              
              <p className="text-sm sm:text-base text-muted-foreground break-words">{feedback.encouragement}</p>
            </Card>

            {/* Detailed Feedback */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Correct Concepts */}
              <Card className="p-4 sm:p-6">
                <h4 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-green-600 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="break-words">What You Got Right ({feedback.correctConcepts.length})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {feedback.correctConcepts.map((concept, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-xs sm:text-sm break-words">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Missing Concepts */}
              <Card className="p-4 sm:p-6">
                <h4 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-orange-600 text-sm sm:text-base">
                  <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="break-words">Areas to Explore More ({feedback.missingConcepts.length})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {feedback.missingConcepts.map((concept, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200 text-xs sm:text-sm break-words">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>

            {/* Incorrect Concepts */}
            {feedback.incorrectConcepts.length > 0 && (
              <Card className="p-4 sm:p-6">
                <h4 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-red-600 text-sm sm:text-base">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="break-words">Concepts to Review ({feedback.incorrectConcepts.length})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {feedback.incorrectConcepts.map((concept, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-red-50 text-red-700 border-red-200 text-xs sm:text-sm break-words">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Suggestions */}
            <Card className="p-4 sm:p-6">
              <h4 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="break-words">Suggestions for Improvement</span>
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                {feedback.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-muted-foreground break-words">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button onClick={resetRevision} variant="outline" className="gap-2 w-full sm:w-auto text-sm">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Try Another Topic</span>
                <span className="sm:hidden">Try Another</span>
              </Button>
              <Button onClick={() => router.push("/student-dashboard")} className="gap-2 w-full sm:w-auto text-sm">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}