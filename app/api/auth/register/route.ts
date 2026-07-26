import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { normalizeEmail } from "@/lib/auth-utils"

// Input validation schema
interface RegisterData {
  email: string
  password: string
  name?: string
}

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body: Partial<RegisterData> = await req.json().catch(() => ({}))
    const { email, password, name } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Normalize email for consistent lookups
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
      select: { id: true }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      )
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12)
    
    // Ensure name is null if empty, not an empty string
    const trimmedName = name?.trim()
    const finalName = trimmedName && trimmedName.length > 0 ? trimmedName : null
    
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: finalName,
        passwordHash,
        emailVerified: new Date(), // Mark email as verified for simplicity
      }
    })

    return NextResponse.json({ 
      success: true,
      message: "Registration successful"
    })

  } catch (error: any) {
    console.error("Registration error:", error)
    
    // Provide more specific error messages
    if (error?.code === 'P2002') {
      // Unique constraint violation
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      )
    }
    
    if (error?.code === 'P1001') {
      // Database connection error
      return NextResponse.json(
        { error: "Database connection failed. Please check your configuration." },
        { status: 500 }
      )
    }
    
    // Return the actual error message if available, otherwise generic message
    const errorMessage = error?.message || "An error occurred during registration. Please try again."
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
