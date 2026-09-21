import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import type { AppEnv } from '../types/hono-env'
import { RateLimiter, type RateLimiterOptions } from '../lib/rate-limiter'
import { getClientIp } from '../lib/client-ip'

export type RateLimitMiddlewareOptions = RateLimiterOptions & {
  // Extra key material beyond the client IP, e.g. the attempted login email.
  // Keeps a scripted burst against one IP but many emails (or vice versa) from
  // sharing a single bucket.
  extraKey?: (c: Context<AppEnv>) => Promise<string | undefined> | string | undefined
}

export function rateLimitMiddleware(options: RateLimitMiddlewareOptions) {
  const limiter = new RateLimiter(options)

  return createMiddleware<AppEnv>(async (c, next) => {
    const ip = getClientIp(c)
    const extra = await options.extraKey?.(c)
    const key = extra ? `${ip}:${extra}` : ip

    const { allowed } = limiter.check(key)
    if (!allowed) {
      throw new HTTPException(429, { message: 'Too many requests' })
    }

    await next()
  })
}
