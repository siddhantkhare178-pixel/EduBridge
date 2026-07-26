import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateVideoUploadSignature } from "@/lib/cloudinary"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
  }

  try {
    const { publicId } = await req.json()
    
    if (!publicId) {
      return NextResponse.json({ error: "Public ID is required" }, { status: 400 })
    }

    const signatureData = await generateVideoUploadSignature(publicId)
    

    
    return NextResponse.json(signatureData)
  } catch (error) {
    console.error("Error generating upload signature:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate signature",
      details: "Check server logs for more information"
    }, { status: 500 })
  }
}