import type { Game } from '../core/types.ts'
import { PolyominoIcon } from './PolyominoIcon.tsx'
import { LEVELS, generatePolyomino, validatePolyomino, type PolyominoAnswer, type PolyominoTask } from './puzzle.ts'
import { PolyominoRenderer } from './PolyominoRenderer.tsx'

/** Spatial game: fill a shape on the grid with the given pieces, turning (and later flipping) them. */
export const polyominoGame: Game<PolyominoTask, PolyominoAnswer> = {
  id: 'polyomino',
  title: { cs: 'Skládačka', en: 'Shape puzzle' },
  module: 'space',
  icon: PolyominoIcon,
  levels: LEVELS.length,
  generate: (difficulty, seed) => generatePolyomino(difficulty, seed),
  validate: validatePolyomino,
  Renderer: PolyominoRenderer,
}
