import { z } from 'zod'

const UserModelSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string().email(),
})

export const AuthRequestSchema = {
  LOGIN: z.object({
    email: z.string().email(),
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
}

export type LoginRequest = z.infer<typeof AuthRequestSchema.LOGIN>
