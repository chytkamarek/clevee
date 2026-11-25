import { createRegistry } from './core/registry.ts'
import { additionGame } from './demo/additionGame.ts'
import { polyominoGame } from './polyomino/polyominoGame.ts'

/**
 * All games of the app. Adding a game = one entry here; the play screen at
 * `#/hra/<id>` picks it up with no other change.
 */
export const games = createRegistry([
  polyominoGame,
  ...(import.meta.env.DEV ? [additionGame] : []),
])
