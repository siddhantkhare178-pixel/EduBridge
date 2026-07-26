"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service if desired
    // console.error(error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground">An unexpected error occurred. Please try again.</p>
          <Button onClick={() => reset()}>Try again</Button>
        </div>
      </body>
    </html>
  )
}


