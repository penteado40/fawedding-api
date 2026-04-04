import { Hono } from 'hono'
import type { AppEnv } from '../types/hono-env'
import { giftController } from '../controllers/gift.controller'

const giftRouter = new Hono<AppEnv>()

giftRouter.route('/', giftController)

export { giftRouter }
