const MINUTE_MS = 60_000

// Generous enough that a real guest filling out a form (or retrying after a typo)
// never hits these, tight enough to blunt a scripted burst. See issue #9.
export const RATE_LIMITS = {
  LOGIN: { limit: 10, windowMs: 5 * MINUTE_MS },
  RSVP_CREATE: { limit: 10, windowMs: MINUTE_MS },
  GIFT_PAYMENT_CREATE: { limit: 10, windowMs: MINUTE_MS },
  GIFT_PAYMENT_CONFIRM: { limit: 30, windowMs: MINUTE_MS },
} as const
