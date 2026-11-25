export type Route = { name: 'home' } | { name: 'play'; gameId: string }

/** `#/hra/<id>` → play screen; anything else → home. */
export function parseRoute(hash: string): Route {
  const match = /^#\/hra\/([^/?#]+)\/?$/.exec(hash)
  if (!match?.[1]) return { name: 'home' }
  try {
    return { name: 'play', gameId: decodeURIComponent(match[1]) }
  } catch {
    return { name: 'home' }
  }
}

export const playHref = (gameId: string) => `#/hra/${encodeURIComponent(gameId)}`
