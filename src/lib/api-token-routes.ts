export type ApiTokenRoute = {
  method: string
  pattern: RegExp
}

// ApiToken actors are only ever allowed to hit this specific set of route/verb
// combinations — one per action a public, unauthenticated site is allowed to take.
// Fine-grained "is this actually your wedding" scoping happens downstream via
// WeddingAccessService, once the actor's weddingId is known.
export const API_TOKEN_ALLOWED_ROUTES: ApiTokenRoute[] = [
  { method: 'POST', pattern: /^\/api\/weddings\/\d+\/rsvps$/ },
  { method: 'GET', pattern: /^\/api\/weddings\/\d+\/gifts$/ },
  { method: 'GET', pattern: /^\/api\/weddings\/\d+\/gifts\/\d+$/ },
  { method: 'POST', pattern: /^\/api\/weddings\/\d+\/gift-payments$/ },
  { method: 'PATCH', pattern: /^\/api\/weddings\/\d+\/gift-payments\/\d+\/confirm$/ },
]

export function isApiTokenRouteAllowed(method: string, path: string): boolean {
  return API_TOKEN_ALLOWED_ROUTES.some((route) => route.method === method && route.pattern.test(path))
}
