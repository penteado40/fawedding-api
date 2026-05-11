import { randomUUID } from 'node:crypto'
import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import { AbstractService } from '../core/abstract-service'
import type { AppEnv } from '../types/hono-env'
import type {
  ApiTokenMeta,
  ApiTokenModel,
  CreateApiTokenRequest,
  SearchApiTokenRequest,
  UpdateApiTokenRequest,
} from '../models/api-token.model'
import { toApiTokenMeta, toApiTokenResponse } from '../models/api-token.model'

export class ApiTokenService extends AbstractService {
  async list(search: SearchApiTokenRequest = {}): Promise<ApiTokenModel[]> {
    const tokens = await this.prisma.apiToken.findMany({
      where: {
        ...(search.name !== undefined && { name: { contains: search.name, mode: 'insensitive' } }),
        ...(search.isActive !== undefined && { isActive: search.isActive }),
        ...(search.id !== undefined && { id: search.id }),
      },
      orderBy: { createdAt: 'desc' },
    })
    return tokens.map(toApiTokenResponse)
  }

  async create(data: CreateApiTokenRequest): Promise<ApiTokenModel> {
    const token = randomUUID()
    const apiToken = await this.prisma.apiToken.create({
      data: { name: data.name, token },
    })
    return toApiTokenResponse(apiToken)
  }

  async getById(id: number): Promise<ApiTokenMeta> {
    const apiToken = await this.prisma.apiToken.findUnique({ where: { id } })
    if (!apiToken) {
      throw new HTTPException(404, { message: 'API token not found' })
    }
    return toApiTokenMeta(apiToken)
  }

  async update(id: number, data: UpdateApiTokenRequest): Promise<ApiTokenMeta> {
    const existing = await this.prisma.apiToken.findUnique({ where: { id } })
    if (!existing) {
      throw new HTTPException(404, { message: 'API token not found' })
    }
    const apiToken = await this.prisma.apiToken.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })
    return toApiTokenMeta(apiToken)
  }

  async delete(id: number): Promise<ApiTokenMeta> {
    const existing = await this.prisma.apiToken.findUnique({ where: { id } })
    if (!existing) {
      throw new HTTPException(404, { message: 'API token not found' })
    }
    const apiToken = await this.prisma.apiToken.delete({ where: { id } })
    return toApiTokenMeta(apiToken)
  }
}

export function createApiTokenService(c: Context<AppEnv>): ApiTokenService {
  return new ApiTokenService(c.get('prisma'))
}
