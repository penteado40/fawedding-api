import { Hono } from 'hono'
import type { AppEnv } from '../types/hono-env'
import { giftRouter } from './gift.routes'
import { rsvpRouter } from './rsvp.routes'
import { apiTokenRouter } from './api-token.routes'

const routes = new Hono<AppEnv>()

routes.route('/gifts', giftRouter)
routes.route('/rsvps', rsvpRouter)
routes.route('/api-tokens', apiTokenRouter)

export { routes }
