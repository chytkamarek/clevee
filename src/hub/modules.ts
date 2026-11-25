import type { AnyGame, GameModule } from '../games/core/types.ts'

/** Places on the home page, in the order they show. */
export const MODULES: readonly GameModule[] = ['math', 'language', 'space']

export interface Place {
  module: GameModule
  games: readonly AnyGame[]
}

/** Pure: every place with its games in registry order; a place with no games is still there. */
export function groupByModule(games: readonly AnyGame[]): Place[] {
  return MODULES.map((module) => ({ module, games: games.filter((g) => g.module === module) }))
}
