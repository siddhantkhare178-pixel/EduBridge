import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_PATHS = ["/", "/login", "/signup", "/api/auth", "/api/health", "/api/courses/public"]

// Protected routes that require authentication
const PROTECTED_PATHS = [
  "/student",
  "/teacher",
  "/onboarding",
  "/announcements",
  "/community-forum",
  "/quiz",
  "/ai-tutor",
  "/course-player",
  "/courses",
  "/student-dashboard",
  "/teacher-dashboard",
  "/manage-course",
  "/teacher-course-preview",
  "/create-course"
]

const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "dev-auth-secret-change-me"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths and Next internal
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")  // Allow files with extensions (images, css, js, etc.)
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: authSecret })
  const isAuth = !!token

  // Check if current path requires authentication
  const requiresAuth = PROTECTED_PATHS.some(path => pathname.startsWith(path))

  // Redirect unauthenticated users to login for protected routes
  if (!isAuth && requiresAuth) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Protect API routes that require authentication
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth") && !pathname.startsWith("/api/health")) {
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  if (!isAuth) return NextResponse.next()

  // If already authenticated, redirect away from login/signup
  if (pathname === "/login" || pathname === "/signup") {
    if (token?.role === "TEACHER") {
      const url = req.nextUrl.clone(); url.pathname = "/teacher-dashboard"; return NextResponse.redirect(url)
    }
    if (token?.role === "STUDENT") {
      const url = req.nextUrl.clone(); url.pathname = "/student-dashboard"; return NextResponse.redirect(url)
    }
    const url = req.nextUrl.clone(); url.pathname = "/onboarding"; return NextResponse.redirect(url)
  }

  // Enforce role-based access
  // Note: If role is null, allow access to dashboard pages - they will handle the redirect
  // This prevents redirect loops when user just set their role
  if (pathname.startsWith("/student-dashboard") || pathname.startsWith("/teacher-dashboard")) {
    // Allow access - let the page component handle role checking and redirects
    // This prevents middleware from creating redirect loops
    return NextResponse.next()
  }

  // Role-based route protection
  if (pathname.startsWith("/student")) {
    if (token?.role === "STUDENT") return NextResponse.next()
    const url = req.nextUrl.clone(); url.pathname = token?.role === "TEACHER" ? "/teacher-dashboard" : "/onboarding"; return NextResponse.redirect(url)
  }

  if (pathname.startsWith("/teacher")) {
    if (token?.role === "TEACHER") return NextResponse.next()
    const url = req.nextUrl.clone(); url.pathname = token?.role === "STUDENT" ? "/student-dashboard" : "/onboarding"; return NextResponse.redirect(url)
  }

  // Teacher-only routes
  if (pathname.startsWith("/manage-course") || pathname.startsWith("/teacher-course-preview") || pathname.startsWith("/create-course")) {
    if (token?.role !== "TEACHER") {
      const url = req.nextUrl.clone()
      url.pathname = token?.role === "STUDENT" ? "/student-dashboard" : "/onboarding"
      return NextResponse.redirect(url)
    }
  }

  // Student-only routes (quiz is primarily for students but could be accessible to teachers too)
  if (pathname.startsWith("/quiz")) {
    if (!token?.role || (token?.role !== "STUDENT" && token?.role !== "TEACHER")) {
      const url = req.nextUrl.clone()
      url.pathname = "/onboarding"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, icons, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
}
