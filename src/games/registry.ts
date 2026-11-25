import { createRegistry } from './core/registry.ts'
import { additionGame } from './demo/additionGame.ts'

/**
 * All games of the app. Adding a game = one entry here; the play screen at
 * `#/hra/<id>` picks it up with no other change.
 */
export const games = createRegistry([
  ...(import.meta.env.DEV ? [additionGame] : []),
])
