import { describe, expect, it } from 'vitest'
import { RateLimiter } from './rate-limiter'

describe('RateLimiter', () => {
  it('allows requests under the limit', () => {
    const limiter = new RateLimiter({ limit: 3, windowMs: 1000 })
    expect(limiter.check('a').allowed).toBe(true)
    expect(limiter.check('a').allowed).toBe(true)
    expect(limiter.check('a').allowed).toBe(true)
  })

  it('denies requests over the limit within the window', () => {
    const limiter = new RateLimiter({ limit: 2, windowMs: 1000 })
    limiter.check('a')
    limiter.check('a')
    expect(limiter.check('a').allowed).toBe(false)
  })

  it('resets after the window elapses', () => {
    let now = 0
    const limiter = new RateLimiter({ limit: 1, windowMs: 1000, now: () => now })

    expect(limiter.check('a').allowed).toBe(true)
    expect(limiter.check('a').allowed).toBe(false)

    now = 1001
    expect(limiter.check('a').allowed).toBe(true)
  })

  it('tracks separate keys independently', () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: 1000 })
    expect(limiter.check('a').allowed).toBe(true)
    expect(limiter.check('b').allowed).toBe(true)
    expect(limiter.check('a').allowed).toBe(false)
    expect(limiter.check('b').allowed).toBe(false)
  })
})
