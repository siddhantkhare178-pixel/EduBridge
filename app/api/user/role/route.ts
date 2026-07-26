import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const role = body?.role as "STUDENT" | "TEACHER" | undefined
  if (role !== "STUDENT" && role !== "TEACHER") return NextResponse.json({ error: "Invalid role" }, { status: 400 })

  await prisma.user.update({ where: { id: session.user.id as string }, data: { role } })
  return NextResponse.json({ ok: true })
}
