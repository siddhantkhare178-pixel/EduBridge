"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleProvider(provider: string) {
    try {
      setLoading(provider)
      await signIn(provider, { callbackUrl: "/onboarding" })
    } finally {
      setLoading(null)
    }
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading("credentials")
    const res = await signIn("credentials", { redirect: false, email: email.trim().toLowerCase(), password, callbackUrl: "/onboarding" })
    setLoading(null)
    if (res?.ok) {
      window.location.href = res.url || "/onboarding"
      return
    }

    const message = res?.error === "CredentialsSignin" ? "Invalid email or password" : "Unable to sign in right now. Please try again."
    setError(message)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="min-h-screen flex flex-col">
          {/* Login Form - Mobile */}
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
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sign in to your EduBridge account</p>
                </div>

                <form onSubmit={handleCredentials} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded text-center">{error}</p>}
                  <Button className="w-full py-2.5 text-sm font-medium" type="submit" disabled={loading !== null}>
                    {loading === "credentials" ? "Signing in..." : "Sign in with Email"}
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
                  <Button variant="outline" onClick={() => handleProvider("github")} disabled={loading !== null} className="py-2.5 text-sm">
                    {loading === "github" ? "..." : "GitHub"}
                  </Button>
                  <Button variant="outline" onClick={() => handleProvider("google")} disabled={loading !== null} className="py-2.5 text-sm">
                    {loading === "google" ? "..." : "Google"}
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                  Don&apos;t have an account?{" "}
                  <Link className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400" href="/signup">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Demo Accounts - Mobile */}
          <div className="p-4 sm:p-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                  🔑 Demo Accounts
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Try EduBridge with sample data</p>
              </div>

              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-1">
                    👨‍🏫 Teachers
                  </h3>
                  <div className="space-y-1">
                    <div className="text-xs text-blue-800 dark:text-blue-200 font-mono bg-white dark:bg-blue-900/30 p-1.5 rounded text-center">
                      sarah.johnson@edubridge.dev
                    </div>
                    <div className="text-xs text-blue-800 dark:text-blue-200 font-mono bg-white dark:bg-blue-900/30 p-1.5 rounded text-center">
                      mike.chen@edubridge.dev
                    </div>
                    <div className="text-xs text-blue-800 dark:text-blue-200 font-mono bg-white dark:bg-blue-900/30 p-1.5 rounded text-center">
                      emma.davis@edubridge.dev
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2 flex items-center gap-1">
                    👨‍🎓 Students
                  </h3>
                  <div className="grid grid-cols-1 gap-1">
                    <div className="text-xs text-green-800 dark:text-green-200 font-mono bg-white dark:bg-green-900/30 p-1.5 rounded text-center">
                      alex.smith@student.edu
                    </div>
                    <div className="text-xs text-green-800 dark:text-green-200 font-mono bg-white dark:bg-green-900/30 p-1.5 rounded text-center">
                      maria.garcia@student.edu
                    </div>
                    <div className="text-xs text-green-800 dark:text-green-200 font-mono bg-white dark:bg-green-900/30 p-1.5 rounded text-center">
                      james.wilson@student.edu
                    </div>
                    <div className="text-xs text-green-800 dark:text-green-200 font-mono bg-white dark:bg-green-900/30 p-1.5 rounded text-center">
                      lisa.brown@student.edu
                    </div>
                    <div className="text-xs text-green-800 dark:text-green-200 font-mono bg-white dark:bg-green-900/30 p-1.5 rounded text-center">
                      david.lee@student.edu
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Password for all accounts:</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-600 px-2 py-1 rounded inline-block">
                    password123
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="min-h-screen flex">
          {/* Left side - Login Form */}
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
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
                  <p className="text-gray-600 dark:text-gray-400">Sign in to your EduBridge account</p>
                </div>

                <form onSubmit={handleCredentials} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
                  <Button className="w-full py-3 text-base font-medium" type="submit" disabled={loading !== null}>
                    {loading === "credentials" ? "Signing in..." : "Sign in with Email"}
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
                  <Button variant="outline" onClick={() => handleProvider("github")} disabled={loading !== null} className="py-3">
                    {loading === "github" ? "..." : "GitHub"}
                  </Button>
                  <Button variant="outline" onClick={() => handleProvider("google")} disabled={loading !== null} className="py-3">
                    {loading === "google" ? "..." : "Google"}
                  </Button>
                </div>

                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  Don&apos;t have an account?{" "}
                  <Link className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400" href="/signup">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Demo Accounts */}
          <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
            <div className="w-full max-w-md">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-4xl mb-2">🔑</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Try Demo Accounts</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Explore EduBridge with pre-loaded sample data
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                      👨‍🏫 Teachers
                    </h3>
                    <div className="space-y-2">
                      <div className="text-sm text-blue-800 dark:text-blue-200 font-mono bg-white dark:bg-blue-900/30 p-2 rounded">
                        sarah.johnson@edubridge.dev
                      </div>
                      <div className="text-sm text-blue-800 dark:text-blue-200 font-mono bg-white dark:bg-blue-900/30 p-2 rounded">
                        mike.chen@edubridge.dev
                      </div>
                      <div className="text-sm text-blue-800 dark:text-blue-200 font-mono bg-white dark:bg-blue-900/30 p-2 rounded">
                        emma.davis@edubridge.dev
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center">
                      👨‍🎓 Students
                    </h3>
                    <div className="space-y-2">
                      <div className="text-sm text-green-800 dark:text-green-200 font-mono bg-white dark:bg-green-900/30 p-2 rounded">
                        alex.smith@student.edu
                      </div>
                      <div className="text-sm text-green-800 dark:text-green-200 font-mono bg-white dark:bg-green-900/30 p-2 rounded">
                        maria.garcia@student.edu
                      </div>
                      <div className="text-sm text-green-800 dark:text-green-200 font-mono bg-white dark:bg-green-900/30 p-2 rounded">
                        james.wilson@student.edu
                      </div>
                      <div className="text-sm text-green-800 dark:text-green-200 font-mono bg-white dark:bg-green-900/30 p-2 rounded">
                        lisa.brown@student.edu
                      </div>
                      <div className="text-sm text-green-800 dark:text-green-200 font-mono bg-white dark:bg-green-900/30 p-2 rounded">
                        david.lee@student.edu
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Password for all accounts:</p>
                    <p className="text-lg font-mono font-semibold text-gray-900 dark:text-white">password123</p>
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