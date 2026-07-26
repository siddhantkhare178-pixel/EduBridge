import NextAuth, { type AuthOptions, type DefaultSession } from "next-auth"
import { getServerSession } from "next-auth/next"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import type { Adapter } from "next-auth/adapters"
import { normalizeEmail } from "./auth-utils"

// Extend the built-in session types
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role?: string
    } & DefaultSession["user"]
  }

  interface User {
    role?: string
  }
}

// Configure NextAuth
const providers: AuthOptions['providers'] = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null

      const normalizedEmail = normalizeEmail(credentials.email)
      if (!normalizedEmail) return null

      const user = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
      })

      if (!user || !user.passwordHash) return null
      const valid = await bcrypt.compare(credentials.password, user.passwordHash)
      if (!valid) return null
      return user as any
    },
  }),
]

// Add GitHub provider only if credentials are available
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  )
}

// Add Google provider only if credentials are available
if (process.env.GOOGLE_ID && process.env.GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    })
  )
}

const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "dev-auth-secret-change-me"
const authUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000"

export const authConfig: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  secret: authSecret,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }: any) {
      if (user) {
        // Initial sign in - set role from user object
        token.id = user.id
        token.role = (user as any).role ?? null
      } else if (token?.email) {
        // Always check database for the latest role
        // This ensures role updates are reflected immediately
        // We check every time to handle role changes
        try {
          const u = await prisma.user.findUnique({ 
            where: { email: token.email as string },
            select: { id: true, role: true }
          })
          if (u) {
            token.id = u.id
            // Always update role from database to ensure it's current
            token.role = (u as any).role ?? null
          }
        } catch (error) {
          // If database query fails, keep existing token values
          console.error("Error fetching user role in JWT callback:", error)
        }
      }
      return token
    },
    async session({ session, token }: any) {
      if (session?.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role ?? null
      }
      return session
    },
  },
}

// Create NextAuth handler for route handlers
const handler = NextAuth(authConfig)

// Export GET and POST handlers for App Router
export const { GET, POST } = handler.handlers || { GET: handler, POST: handler }

// Export a helper auth function for server components
// This uses getServerSession which is the recommended approach for NextAuth v4
export async function auth() {
  return await getServerSession(authConfig)
}

// Export signIn and signOut if available
// Note: For client-side usage, import from 'next-auth/react' instead
export const signIn = (handler as any).signIn
export const signOut = (handler as any).signOut