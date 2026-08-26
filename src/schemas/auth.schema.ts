import { z } from 'zod'

const UserModelSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['SUPER_ADMIN', 'USER']),
})

export const AuthRequestSchema = {
  LOGIN: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  TOKEN: z.object({
    grant_type: z.literal('password'),
    username: z.string().email(),
    password: z.string().min(1),
  }),
}

export const AuthResponseSchema = {
  LOGIN: z.object({
    data: z.object({
      token: z.string(),
      user: UserModelSchema,
    }),
  }),
  TOKEN: z.object({
    access_token: z.string(),
    token_type: z.literal('bearer'),
    expires_in: z.number().int(),
  }),
}

export type LoginRequest = z.infer<typeof AuthRequestSchema.LOGIN>
