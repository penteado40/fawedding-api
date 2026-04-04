import { Hono } from 'hono'
import type { AppEnv } from '../types/hono-env'
import { giftRouter } from './gift.routes'

const routes = new Hono<AppEnv>()

routes.route('/gifts', giftRouter)

export { routes }
