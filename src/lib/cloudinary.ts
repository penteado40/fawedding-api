import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export type UploadedImage = {
  url: string
  publicId: string
}

export async function uploadGiftImage(weddingId: number, buffer: Buffer, filename: string): Promise<UploadedImage> {
  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `fawedding/${weddingId}/gifts`,
        filename_override: filename,
        use_filename: true,
        unique_filename: true,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error('Cloudinary upload returned no result'))
          return
        }
        resolve(uploadResult)
      },
    )
    stream.end(buffer)
  })

  return { url: result.secure_url, publicId: result.public_id }
}

export async function uploadGiftImageFromUrl(weddingId: number, imageUrl: string): Promise<UploadedImage> {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: `fawedding/${weddingId}/gifts`,
    unique_filename: true,
    allowed_formats: ['jpg', 'png', 'webp', 'gif'],
  })
  return { url: result.secure_url, publicId: result.public_id }
}

export async function deleteGiftImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}
