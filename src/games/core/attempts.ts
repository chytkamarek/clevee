import type { Difficulty } from './types.ts'

/** One checked answer. */
export interface Attempt {
  gameId: string
  difficulty: Difficulty
  seed: number
  correct: boolean
  /** From showing the task to checking the answer. */
  durationMs: number
  hints: number
  /** Epoch ms when the answer was checked. */
  at: number
}

export const ATTEMPTS_KEY = 'clevee.attempts.v1'

/** Only the newest attempts are kept, so history cannot grow until storage refuses writes. */
export const MAX_ATTEMPTS = 2000

/** Subset of `Storage`, so tests can pass a stub. */
export type AttemptStorage = Pick<Storage, 'getItem' | 'setItem'>

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function isAttempt(v: unknown): v is Attempt {
  if (typeof v !== 'object' || v === null) return false
  const a = v as Record<string, unknown>
  return (
    typeof a.gameId === 'string' &&
    isNum(a.difficulty) &&
    isNum(a.seed) &&
    typeof a.correct === 'boolean' &&
    isNum(a.durationMs) &&
    isNum(a.hints) &&
    isNum(a.at)
  )
}

/**
 * Stored history. Unreadable data reads as an empty history; malformed records
 * are dropped so one bad record does not cost the valid ones.
 */
export function loadAttempts(storage: AttemptStorage): Attempt[] {
  try {
    const raw = storage.getItem(ATTEMPTS_KEY)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isAttempt) : []
  } catch {
    return []
  }
}

/** Appends one attempt. Returns false when storage refused it (full, private mode). */
export function saveAttempt(storage: AttemptStorage, attempt: Attempt): boolean {
  try {
    storage.setItem(ATTEMPTS_KEY, JSON.stringify([...loadAttempts(storage), attempt].slice(-MAX_ATTEMPTS)))
    return true
  } catch {
    return false
  }
}

/** `localStorage`, or `null` where touching it throws (blocked site data). */
export function browserStorage(): AttemptStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
