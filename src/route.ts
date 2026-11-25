export type Route =
  | { name: 'home' }
  | { name: 'path'; gameId: string }
  | { name: 'play'; gameId: string; level: number }

/** `#/hra/<id>` → the game's path; `#/hra/<id>/<level>` → play that level; anything else → home. */
export function parseRoute(hash: string): Route {
  const match = /^#\/hra\/([^/?#]+)(?:\/([1-9]\d{0,2}))?\/?$/.exec(hash)
  if (!match?.[1]) return { name: 'home' }
  let gameId: string
  try {
    gameId = decodeURIComponent(match[1])
  } catch {
    return { name: 'home' }
  }
  return match[2] ? { name: 'play', gameId, level: Number(match[2]) } : { name: 'path', gameId }
}

export const pathHref = (gameId: string) => `#/hra/${encodeURIComponent(gameId)}`
export const playHref = (gameId: string, level: number) => `${pathHref(gameId)}/${level}`
