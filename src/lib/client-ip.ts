import type { Context } from 'hono'
import { getConnInfo } from '@hono/node-server/conninfo'

// Render (and most PaaS reverse proxies) terminate TLS in front of the app and forward
// the real client IP via X-Forwarded-For. Fall back to the raw socket address (accurate
// only when running without a proxy, e.g. locally) if the header is absent.
export function getClientIp(c: Context): string {
  const forwardedFor = c.req.header('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]!.trim()
  }
  return getConnInfo(c).remote.address ?? 'unknown'
}
