import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-2xl font-bold">Page not found</h2>
        <p className="text-muted-foreground">We couldn’t find the page you’re looking for.</p>
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
      </div>
    </div>
  )
}


