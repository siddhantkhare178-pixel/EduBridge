import { useEffect, useRef, useState, useCallback } from 'react'

interface LearningTrackerOptions {
  lessonId: string
  courseId: string
  autoStart?: boolean
  minDuration?: number
}

export function useLearningTrackerSimple({
  lessonId,
  courseId,
  autoStart = true,
  minDuration = 1
}: LearningTrackerOptions) {
  const [isActive, setIsActive] = useState(false)
  const [duration, setDuration] = useState(0)

  const startTimeRef = useRef<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<Date>(new Date())
  const lastSavedRef = useRef<number>(0)
  const currentLessonRef = useRef<string>(lessonId)
  const currentCourseRef = useRef<string>(courseId)

  // Stop tracking
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (autoSaveRef.current) {
      clearInterval(autoSaveRef.current)
      autoSaveRef.current = null
    }
    setIsActive(false)
  }, [])

  // Save session function
  const saveCurrentSession = useCallback(async () => {
    if (!startTimeRef.current) return false

    const endTime = new Date()
    const currentDuration = Math.floor((endTime.getTime() - startTimeRef.current.getTime()) / 1000)

    if (currentDuration < minDuration || currentDuration === lastSavedRef.current) {
      return false
    }

    try {
      const response = await fetch('/api/learning-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: currentLessonRef.current,
          courseId: currentCourseRef.current,
          startTime: startTimeRef.current.toISOString(),
          endTime: endTime.toISOString(),
          duration: currentDuration
        })
      })

      if (response.ok) {
        lastSavedRef.current = currentDuration
        return true
      }
    } catch (error) {
      console.error('Learning time save failed:', error)
    }
    return false
  }, [minDuration])

  // Internal start function that doesn't check isActive
  const forceStart = useCallback(() => {
    // Clear any existing intervals first
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (autoSaveRef.current) {
      clearInterval(autoSaveRef.current)
      autoSaveRef.current = null
    }

    startTimeRef.current = new Date()
    setIsActive(true)
    setDuration(0)
    lastSavedRef.current = 0
    lastActivityRef.current = new Date()

    // Update timer every second
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
        setDuration(elapsed)

        // Auto-pause after 2 minutes of inactivity
        if (Date.now() - lastActivityRef.current.getTime() > 120000) {
          stop()
        }
      }
    }, 1000)

    // Auto-save every 30 seconds
    autoSaveRef.current = setInterval(() => {
      saveCurrentSession()
    }, 30000)
  }, [saveCurrentSession, stop])

  // Start tracking (with active check)
  const start = useCallback(() => {
    if (isActive) return
    forceStart()
  }, [isActive, forceStart])

  // Pause and save
  const pause = useCallback(async () => {
    await saveCurrentSession()
    stop()
  }, [saveCurrentSession, stop])

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Activity tracking
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = new Date()
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity)
      })
    }
  }, [])

  // Auto-start and cleanup
  useEffect(() => {
    if (autoStart) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        forceStart()
      }, 0)

      return () => clearTimeout(timer)
    }
  }, [autoStart, forceStart])

  // Page visibility and cleanup
  useEffect(() => {
    // Page visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveCurrentSession()
        stop()
      } else if (autoStart && !isActive) {
        start()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Page unload
    const handleBeforeUnload = () => {
      if (startTimeRef.current) {
        const currentDuration = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
        if (currentDuration >= minDuration) {
          const formData = new FormData()
          formData.append('lessonId', currentLessonRef.current)
          formData.append('courseId', currentCourseRef.current)
          formData.append('startTime', startTimeRef.current.toISOString())
          formData.append('endTime', new Date().toISOString())
          formData.append('duration', currentDuration.toString())
          navigator.sendBeacon('/api/learning-time', formData)
        }
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      // Save on cleanup
      if (startTimeRef.current) {
        const currentDuration = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
        if (currentDuration >= minDuration) {
          fetch('/api/learning-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lessonId: currentLessonRef.current,
              courseId: currentCourseRef.current,
              startTime: startTimeRef.current.toISOString(),
              endTime: new Date().toISOString(),
              duration: currentDuration
            })
          }).catch(console.error)
        }
      }

      stop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [courseId, minDuration, saveCurrentSession, stop, start, isActive, autoStart]) // Added autoStart dependency

  // Handle lesson changes separately
  useEffect(() => {
    const previousLessonId = currentLessonRef.current
    const previousCourseId = currentCourseRef.current

    // Update refs
    currentLessonRef.current = lessonId
    currentCourseRef.current = courseId

    // Only handle if lesson actually changed (not initial mount)
    if (previousLessonId !== lessonId && previousLessonId) {
      // Save current session if one is active
      if (startTimeRef.current && isActive) {
        const currentDuration = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
        if (currentDuration >= minDuration) {
          fetch('/api/learning-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lessonId: previousLessonId, // Save with previous lesson ID
              courseId: previousCourseId,
              startTime: startTimeRef.current.toISOString(),
              endTime: new Date().toISOString(),
              duration: currentDuration
            })
          }).catch(console.error)
        }
      }

      // Stop current tracking and start new session
      setTimeout(() => {
        stop()
        
        // Start new session for new lesson if autoStart is enabled
        if (autoStart) {
          setTimeout(() => {
            // Force start regardless of current state
            forceStart()
          }, 100) // Shorter delay since stop is already async
        }
      }, 0) // Use setTimeout to avoid synchronous setState in effect
    }
  }, [lessonId, courseId, autoStart, forceStart, isActive, minDuration, stop]) // Added missing dependencies

  return {
    isActive,
    duration,
    formattedDuration: formatDuration(duration),
    start,
    pause,
    stop
  }
}