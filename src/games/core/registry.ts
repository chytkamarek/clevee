import type { AnyGame } from './types.ts'

export interface GameRegistry {
  get(id: string): AnyGame | undefined
  list(): readonly AnyGame[]
}

/** Builds a lookup over the given games; a duplicate id is a programming error and throws. */
export function createRegistry(games: readonly AnyGame[]): GameRegistry {
  const byId = new Map<string, AnyGame>()
  for (const game of games) {
    if (byId.has(game.id)) throw new Error(`Hra s id "${game.id}" je registrovaná dvakrát`)
    byId.set(game.id, game)
  }
  const all = [...byId.values()]
  return {
    get: (id) => byId.get(id),
    list: () => all,
  }
}
