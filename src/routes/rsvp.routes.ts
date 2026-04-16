import { Hono } from 'hono'
import type { AppEnv } from '../types/hono-env'
import { rsvpController } from '../controllers/rsvp.controller'

const rsvpRouter = new Hono<AppEnv>()

rsvpRouter.route('/', rsvpController)

export { rsvpRouter }
