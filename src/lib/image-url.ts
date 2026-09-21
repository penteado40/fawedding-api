import { HTTPException } from 'hono/http-exception'

// Hosts Cloudinary is allowed to fetch gift images from. Exact hostname match only.
export const ALLOWED_IMAGE_URL_HOSTS = ['images.unsplash.com']

// Validates a user-supplied image URL before it is handed to Cloudinary, which does the
// actual fetching. Returns the normalized URL.
export function assertAllowedImageUrl(raw: string): string {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new HTTPException(400, { message: 'imageUrl must be a valid URL' })
  }

  if (url.protocol !== 'https:') {
    throw new HTTPException(400, { message: 'imageUrl must use https' })
  }
  if (url.username || url.password || url.port) {
    throw new HTTPException(400, { message: 'imageUrl must not contain credentials or a custom port' })
  }
  if (!ALLOWED_IMAGE_URL_HOSTS.includes(url.hostname)) {
    throw new HTTPException(400, {
      message: `imageUrl host must be one of: ${ALLOWED_IMAGE_URL_HOSTS.join(', ')}`,
    })
  }

  return url.toString()
}
