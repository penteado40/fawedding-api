import type { Context } from 'hono'

type ZodIssueLike = { path: PropertyKey[]; message: string }
type ZodErrorLike = { issues: ZodIssueLike[] }

export function formatZodError(error: ZodErrorLike): string {
  return error.issues
    .map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
    .join('; ')
}

// Shared hook passed to every `validator(...)` call so validation failures return
// the same { errors: "..." } shape as the rest of the API instead of the raw
// { success, error } object @hono/zod-validator returns by default.
export function zodErrorHook(
  result: { success: true } | { success: false; error: ZodErrorLike },
  c: Context,
) {
  if (!result.success) {
    return c.json({ errors: formatZodError(result.error) }, 400)
  }
}
