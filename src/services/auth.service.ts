import { compare } from 'bcryptjs'
import { sign } from 'hono/jwt'
import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import { AbstractService } from '../core/abstract-service'
import type { AppEnv } from '../types/hono-env'
import type { LoginRequest } from '../schemas/auth.schema'
import { toUserResponse, type UserModel } from '../models/user.model'

const ONE_HOUR = 60 * 60

export type LoginResult = {
  token: string
  user: UserModel
}

export class AuthService extends AbstractService {
  async login(data: LoginRequest, jwtSecret: string): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } })

    if (!user || !(await compare(data.password, user.hashedPassword))) {
      throw new HTTPException(401, { message: 'Invalid credentials' })
    }

    const payload = {
      sub: String(user.id),
      email: user.email,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + ONE_HOUR,
    }

    const token = await sign(payload, jwtSecret)

    return { token, user: toUserResponse(user) }
  }
}

export function createAuthService(c: Context<AppEnv>): AuthService {
  return new AuthService(c.get('prisma'))
}
