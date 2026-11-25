import type { Attempt } from './attempts.ts'
import type { AnyGame, Difficulty, Locale } from './types.ts'

/**
 * Play cycle as a pure state machine: task → (answer, hints) → check → result → next task.
 * No clocks or randomness inside; the caller passes `now` and `seed`.
 */
export type SessionState =
  | {
      phase: 'answering'
      task: unknown
      /** Task counter in this session; the renderer is keyed by it. */
      round: number
      seed: number
      answer: unknown
      hints: number
      startedAt: number
    }
  | {
      phase: 'result'
      task: unknown
      round: number
      seed: number
      answer: unknown
      hints: number
      startedAt: number
      correct: boolean
      attempt: Attempt
    }

export type SessionAction =
  | { type: 'answer'; answer: unknown }
  | { type: 'hint' }
  | { type: 'check'; now: number }
  | { type: 'next'; seed: number; now: number }

export interface SessionConfig {
  game: AnyGame
  difficulty: Difficulty
  locale: Locale
}

export function startSession(config: SessionConfig, seed: number, now: number, round = 0): SessionState {
  return {
    phase: 'answering',
    round,
    task: config.game.generate(config.difficulty, seed, config.locale),
    seed,
    answer: null,
    hints: 0,
    startedAt: now,
  }
}

export function sessionReducer(
  config: SessionConfig,
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case 'answer':
      return state.phase === 'answering' ? { ...state, answer: action.answer } : state
    case 'hint':
      return state.phase === 'answering' ? { ...state, hints: state.hints + 1 } : state
    case 'check': {
      if (state.phase !== 'answering' || state.answer === null) return state
      const correct = config.game.validate(state.task, state.answer)
      return {
        ...state,
        phase: 'result',
        correct,
        attempt: {
          gameId: config.game.id,
          difficulty: config.difficulty,
          seed: state.seed,
          correct,
          durationMs: Math.max(0, action.now - state.startedAt),
          hints: state.hints,
          at: action.now,
        },
      }
    }
    case 'next':
      return state.phase === 'result' ? startSession(config, action.seed, action.now, state.round + 1) : state
  }
}
