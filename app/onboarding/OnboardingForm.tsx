"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

export default function OnboardingForm() {
  const [role, setRole] = useState<"STUDENT" | "TEACHER" | "">("")
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!role) {
      toast({ title: "Select a role", description: "Please choose Student or Teacher" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/user/role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        toast({ title: "Failed", description: "Could not set your role. Try again." })
        setLoading(false)
        return
      }
      
      // Show success message
      toast({ title: "Success", description: "Role updated! Redirecting..." })
      
      // Wait for the database update to complete
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const dashboardPath = role === "STUDENT" ? "/student-dashboard" : "/teacher-dashboard"
      // Use replace to avoid back button issues and force a hard navigation
      // This ensures a fresh session load with the updated role
      window.location.replace(dashboardPath)
    } catch (_) {
      toast({ title: "Error", description: "Network error. Try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <h1 className="text-2xl font-semibold text-center">Choose your role</h1>
      <div className="space-y-3">
        <label className="flex items-center gap-3 border rounded-md p-4 cursor-pointer">
          <input type="radio" name="role" value="STUDENT" checked={role === "STUDENT"} onChange={() => setRole("STUDENT")} />
          <span>Student</span>
        </label>
        <label className="flex items-center gap-3 border rounded-md p-4 cursor-pointer">
          <input type="radio" name="role" value="TEACHER" checked={role === "TEACHER"} onChange={() => setRole("TEACHER")} />
          <span>Teacher</span>
        </label>
      </div>
      <Button className="w-full" onClick={submit} disabled={loading}>
        {loading ? "Saving..." : "Continue"}
      </Button>
    </div>
  )
}
