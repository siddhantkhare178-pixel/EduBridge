"use client"

import { Clock, Play, Pause, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useLearningTrackerSimple } from "@/hooks/use-learning-tracker-simple"

interface LearningTimeTrackerProps {
  lessonId: string
  courseId: string
  autoStart?: boolean
  showControls?: boolean
  className?: string
}

export function LearningTimeTracker({
  lessonId,
  courseId,
  autoStart = true,
  showControls = true,
  className = ""
}: LearningTimeTrackerProps) {
  const {
    isActive: isTracking,
    duration: sessionDuration,
    formattedDuration,
    start: startTracking,
    pause: pauseTracking,
    stop: stopTracking
  } = useLearningTrackerSimple({
    lessonId,
    courseId,
    autoStart,
    minDuration: 1 // Track sessions longer than 1 second
  })

  if (!showControls) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Clock className="w-4 h-4" />
        <span>{formattedDuration}</span>
        {isTracking && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>
    )
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <div className="font-medium text-lg">{formattedDuration}</div>
              <div className="text-sm text-muted-foreground">
                {isTracking ? "Learning in progress" : "Session paused"}
              </div>
            </div>
          </div>
          {isTracking && (
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isTracking ? (
            <Button
              onClick={startTracking}
              size="sm"
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              Start
            </Button>
          ) : (
            <Button
              onClick={pauseTracking}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Pause className="w-4 h-4" />
              Pause
            </Button>
          )}
          
          <Button
            onClick={stopTracking}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            Stop
          </Button>
        </div>
      </div>
    </Card>
  )
}