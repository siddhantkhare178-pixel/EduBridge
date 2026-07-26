import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

// Helper function to generate video upload signature
export async function generateVideoUploadSignature(publicId: string, folder: string = 'edubridge/videos') {
  // Check if all required environment variables are present
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(`Missing Cloudinary credentials: ${
      !cloudName ? 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ' : ''
    }${
      !apiKey ? 'CLOUDINARY_API_KEY ' : ''
    }${
      !apiSecret ? 'CLOUDINARY_API_SECRET ' : ''
    }`)
  }

  const timestamp = Math.round(new Date().getTime() / 1000)
  
  // Create the exact parameters that will be sent to Cloudinary
  const paramsToSign = {
    folder: folder,
    public_id: publicId,
    timestamp: timestamp,
  }

  // Generate signature - this must match exactly what Cloudinary expects
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret)



  return {
    timestamp,
    signature,
    api_key: apiKey,
    cloud_name: cloudName,
    folder,
    public_id: publicId,
  }
}

// Helper function to get optimized video URL
export function getOptimizedVideoUrl(publicId: string, options: any = {}) {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    quality: 'auto:good',
    format: 'auto',
    ...options,
  })
}