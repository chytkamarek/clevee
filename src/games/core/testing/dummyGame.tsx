import type { Game } from '../types.ts'

/** Test game: task is the seed, the correct answer is seed + 1. */
export const dummyGame: Game<{ n: number; difficulty: number }, number> = {
  id: 'dummy',
  title: { cs: 'Testovací hra', en: 'Test game' },
  generate: (difficulty, seed) => ({ n: seed, difficulty }),
  validate: (task, answer) => answer === task.n + 1,
  Renderer: ({ task, answer, onAnswer, onHint, locked }) => (
    <div>
      <p>Úloha {task.n}</p>
      <input
        aria-label="Odpověď"
        value={answer ?? ''}
        readOnly={locked}
        onChange={(e) => onAnswer(e.target.value === '' ? null : Number(e.target.value))}
      />
      <button type="button" onClick={onHint}>
        Nápověda
      </button>
    </div>
  ),
}
