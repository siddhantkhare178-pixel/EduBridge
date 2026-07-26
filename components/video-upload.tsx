"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Upload, Video, X, Play } from "lucide-react"

interface VideoUploadProps {
  onUploadComplete: (videoUrl: string, publicId: string) => void
  onUploadStart?: () => void
  onUploadError?: (error: string) => void
  currentVideoUrl?: string
  disabled?: boolean
}

export function VideoUpload({ 
  onUploadComplete, 
  onUploadStart, 
  onUploadError,
  currentVideoUrl,
  disabled = false
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      onUploadError?.("Please select a video file")
      return
    }

    // Check file size (limit to 100MB)
    if (file.size > 100 * 1024 * 1024) {
      onUploadError?.("Video file must be less than 100MB")
      return
    }

    uploadVideo(file)
  }

  const uploadVideo = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    onUploadStart?.()

    try {
      // Generate unique public ID
      const publicId = `lesson_video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Get upload signature from our API
      const signatureResponse = await fetch('/api/upload/video-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId })
      })

      if (!signatureResponse.ok) {
        const errorData = await signatureResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get upload signature')
      }

      const signatureData = await signatureResponse.json()

      // Create form data for Cloudinary upload
      // IMPORTANT: Only include parameters that were used to generate the signature
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', signatureData.api_key)
      formData.append('folder', signatureData.folder)
      formData.append('public_id', signatureData.public_id)
      formData.append('timestamp', signatureData.timestamp.toString())
      formData.append('signature', signatureData.signature)
      


      // Upload to Cloudinary with progress tracking
      const uploadResponse = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setUploadProgress(Math.round(percentComplete))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.responseText, { status: xhr.status }))
          } else {

            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })

        xhr.open('POST', `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/video/upload`)
        xhr.send(formData)
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Upload failed')
      }

      const result = await uploadResponse.json()
      
      // Call success callback with the video URL
      onUploadComplete(result.secure_url, result.public_id)
      
    } catch (error) {
      console.error('Upload error:', error)
      let errorMessage = "Failed to upload video. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = "Authentication failed. Please check your Cloudinary credentials in the configuration above."
        } else if (error.message.includes('400')) {
          errorMessage = "Invalid request. Please check your video file format and size."
        } else if (error.message.includes('Missing Cloudinary credentials')) {
          errorMessage = "Cloudinary is not configured. Please set up your environment variables."
        } else {
          errorMessage = `Upload failed: ${error.message}`
        }
      }
      
      onUploadError?.(errorMessage)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const removeVideo = () => {
    onUploadComplete("", "")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (currentVideoUrl && !uploading) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              <span className="font-medium">Video uploaded successfully</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeVideo}
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              src={currentVideoUrl}
              controls
              className="w-full h-full"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Students will see this video in the lesson
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploading video...</p>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                This may take a few minutes depending on video size
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Upload className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Upload Video</p>
              <p className="text-sm text-muted-foreground">
                Drag and drop your video file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports MP4, MOV, AVI, and other video formats (max 100MB)
              </p>
            </div>
            <Button variant="outline" disabled={disabled}>
              <Upload className="w-4 h-4 mr-2" />
              Choose Video File
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}