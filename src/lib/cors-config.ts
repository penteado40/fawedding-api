// Comma-separated list of allowed frontend origins, e.g.
// "https://fawedding.com.br,https://adeilta.com.br,http://localhost:5173".
// Parsed once at startup — add/remove an origin by changing the env var, no code change.
function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) {
    return []
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
}

export const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.CORS_ORIGINS)

export function matchAllowedOrigin(requestOrigin: string): string | undefined {
  return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : undefined
}
