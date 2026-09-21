export type RateLimiterOptions = {
  limit: number
  windowMs: number
  now?: () => number
}

export type RateLimitResult = {
  allowed: boolean
}

type Bucket = {
  count: number
  resetAt: number
}

// Fixed-window counter, in-memory only. Explicitly single-instance — see PRD (issue #9)
// for why a shared/Redis-backed limiter is out of scope until the API runs on more than
// one instance.
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>()
  private readonly limit: number
  private readonly windowMs: number
  private readonly now: () => number

  constructor(options: RateLimiterOptions) {
    this.limit = options.limit
    this.windowMs = options.windowMs
    this.now = options.now ?? Date.now
  }

  check(key: string): RateLimitResult {
    const now = this.now()
    const bucket = this.buckets.get(key)

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs })
      return { allowed: true }
    }

    if (bucket.count >= this.limit) {
      return { allowed: false }
    }

    bucket.count += 1
    return { allowed: true }
  }
}
