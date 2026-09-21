import { createHash, timingSafeEqual } from 'node:crypto'

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function verifyToken(token: string | undefined, storedHash: string | undefined): boolean {
  if (!token || !storedHash) {
    return false
  }
  const candidate = Buffer.from(hashToken(token), 'hex')
  const stored = Buffer.from(storedHash, 'hex')
  if (candidate.length !== stored.length) {
    return false
  }
  return timingSafeEqual(candidate, stored)
}
