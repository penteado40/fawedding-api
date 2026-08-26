import { z } from 'zod'

const BR_DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/

// Accepts dd/mm/yyyy (the format every date-taking POST body uses) and parses it
// into a real Date for Prisma — rejecting calendar-invalid dates like 31/02/2026
// instead of letting them silently roll over to March.
export const BrDateSchema = z
  .string()
  .regex(BR_DATE_REGEX, 'date must be in dd/mm/yyyy format')
  .transform((value, ctx) => {
    const match = value.match(BR_DATE_REGEX)!
    const day = Number(match[1])
    const month = Number(match[2])
    const year = Number(match[3])
    const date = new Date(Date.UTC(year, month - 1, day))

    const isValid =
      date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    if (!isValid) {
      ctx.addIssue({ code: 'custom', message: 'invalid calendar date' })
      return z.NEVER
    }

    return date
  })
