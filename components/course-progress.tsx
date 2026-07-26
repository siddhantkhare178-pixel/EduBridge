"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Lesson = { id: string; order: number; title: string; contentURL?: string | null }

type ProgressRow = {
  lessonId: string
  order: number
  progress: { id: string; percent: number; completedAt?: string | null } | null
}

export default function CourseProgress({ courseId, lessons }: { courseId: string; lessons: Lesson[] }) {
  const [rows, setRows] = useState<ProgressRow[] | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/progress?courseId=${encodeURIComponent(courseId)}`, { cache: "no-store" })
      if (res.ok) {
        const data = (await res.json()) as ProgressRow[]
        setRows(data)
      } else {
        // fallback: build rows without progress
        setRows(
          lessons
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((l) => ({ lessonId: l.id, order: l.order, progress: null }))
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  const overall = useMemo(() => {
    if (!rows || !rows.length) return 0
    const total = rows.reduce((acc, r) => acc + (r.progress?.percent ?? 0), 0)
    return Math.round(total / rows.length)
  }, [rows])

  const markComplete = async (lessonId: string) => {
    setLoading(true)
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, percent: 100, completedAt: new Date().toISOString() }),
      })
      await load()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Overall Progress</div>
            <div className="text-2xl font-bold text-foreground">{overall}%</div>
          </div>
          <div className="w-48 bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: `${overall}%` }} />
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {(rows ?? lessons.map((l) => ({ lessonId: l.id, order: l.order, progress: null })))
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((r) => {
            const l = lessons.find((x) => x.id === r.lessonId)!
            const pct = r.progress?.percent ?? 0
            const done = pct >= 100
            return (
              <Card key={r.lessonId} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-foreground">
                    <span className="font-medium mr-2">Lesson {l.order}:</span>
                    <span>{l.title}</span>
                  </div>
                  <div className="mt-2 w-64 bg-muted rounded-full h-1.5">
                    <div className="bg-secondary h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {l.contentURL ? (
                    <a href={l.contentURL} className="text-xs text-primary hover:underline">
                      Open
                    </a>
                  ) : null}
                  <Button size="sm" variant={done ? "outline" : "default"} disabled={loading || done} onClick={() => markComplete(l.id)}>
                    {done ? "Completed" : "Mark complete"}
                  </Button>
                </div>
              </Card>
            )
          })}
      </div>
    </div>
  )
}
