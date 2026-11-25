import { createRng } from '../core/rng.ts'
import type { Game } from '../core/types.ts'
import { AdditionIcon } from './AdditionIcon.tsx'
import { AdditionRenderer } from './AdditionRenderer.tsx'

export interface AdditionTask {
  a: number
  b: number
}

/** Dummy game that exercises the core; registered only in development. */
export const additionGame: Game<AdditionTask, number> = {
  id: 'demo-addition',
  title: { cs: 'Ukázka: sčítání', en: 'Demo: addition' },
  module: 'math',
  icon: AdditionIcon,
  levels: 3,
  generate(difficulty, seed) {
    const rng = createRng(seed)
    const max = 10 * Math.max(1, Math.floor(difficulty))
    return { a: rng.int(0, max), b: rng.int(0, max) }
  },
  validate: (task, answer) => task.a + task.b === answer,
  Renderer: AdditionRenderer,
}
