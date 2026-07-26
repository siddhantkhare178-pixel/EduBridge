"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"
import Link from "next/link"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleProvider(provider: string) {
    try {
      setOauthLoading(provider)
      await signIn(provider, { callbackUrl: "/onboarding" })
    } finally {
      setOauthLoading(null)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const errorMessage = data?.error || `Registration failed (${res.status})`
        setError(errorMessage)
        setLoading(false)
        return
      }
      // Automatically sign in after successful registration
      const login = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
        callbackUrl: "/onboarding"
      })

      if (login?.ok) {
        window.location.href = login.url || "/onboarding"
      } else {
        // Registration succeeded but login failed - redirect to login page
        setError("Account created successfully! Please sign in.")
        setTimeout(() => {
          window.location.href = "/login"
        }, 2000)
      }
    } catch (_) {
      setError("Network error. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="min-h-screen flex flex-col">
          {/* Signup Form - Mobile */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <Link 
                    href="/" 
                    className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm">Back</span>
                  </Link>
                </div>
                <div className="text-center space-y-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Join EduBridge</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Create your account to get started</p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded text-center">{error}</p>}
                  <Button className="w-full py-2.5 text-sm font-medium bg-purple-600 hover:bg-purple-700" type="submit" disabled={loading || oauthLoading !== null}>
                    {loading ? "Creating..." : "Create account"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => handleProvider("github")} disabled={loading || oauthLoading !== null} className="py-2.5 text-sm">
                    {oauthLoading === "github" ? "..." : "GitHub"}
                  </Button>
                  <Button variant="outline" onClick={() => handleProvider("google")} disabled={loading || oauthLoading !== null} className="py-2.5 text-sm">
                    {oauthLoading === "google" ? "..." : "Google"}
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                  Already have an account?{" "}
                  <Link className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400" href="/login">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Demo Info - Mobile */}
          <div className="p-4 sm:p-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                  💡 Try Demo First
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Experience EduBridge with sample data
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    🚀 What&apos;s included:
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <div className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                      Courses
                    </div>
                    <div className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                      Assignments
                    </div>
                    <div className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>
                      Materials
                    </div>
                    <div className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></span>
                      Grades
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3">
                  <div className="flex items-center justify-center space-x-3 text-sm mb-3">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
                      3 Teachers
                    </span>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs">
                      5 Students
                    </span>
                  </div>
                  <div className="text-center">
                    <Link
                      href="/login"
                      className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      Try Demo Accounts →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="min-h-screen flex">
          {/* Left side - Signup Form */}
          <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
            <div className="w-full max-w-md">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <Link 
                    href="/" 
                    className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-medium">Back to Home</span>
                  </Link>
                </div>
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Join EduBridge</h1>
                  <p className="text-gray-600 dark:text-gray-400">Create your account to get started</p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name (optional)"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
                  <Button className="w-full py-3 text-base font-medium bg-purple-600 hover:bg-purple-700" type="submit" disabled={loading || oauthLoading !== null}>
                    {loading ? "Creating account..." : "Create account"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => handleProvider("github")} disabled={loading || oauthLoading !== null} className="py-3">
                    {oauthLoading === "github" ? "..." : "GitHub"}
                  </Button>
                  <Button variant="outline" onClick={() => handleProvider("google")} disabled={loading || oauthLoading !== null} className="py-3">
                    {oauthLoading === "google" ? "..." : "Google"}
                  </Button>
                </div>

                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  Already have an account?{" "}
                  <Link className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400" href="/login">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Demo Info */}
          <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
            <div className="w-full max-w-md">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-4xl mb-2">💡</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Try Before You Sign Up</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Experience EduBridge with our demo accounts
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      🚀 What you&apos;ll get with demo accounts:
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Pre-loaded courses and content
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        Sample assignments and grades
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                        Interactive learning materials
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                        Teacher and student perspectives
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      👥 Available Demo Roles:
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Teachers</span>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">3 accounts</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Students</span>
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">5 accounts</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                    >
                      Try Demo Accounts →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}