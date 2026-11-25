import { loadAttempts, type Attempt, type AttemptStorage } from '../games/core/attempts.ts'

/** Identifies the newest attempt already counted. */
type AttemptMark = Pick<Attempt, 'gameId' | 'seed' | 'at'>

/**
 * Klíček's growth, stored apart from the attempt history: the history keeps only
 * the newest `MAX_ATTEMPTS`, but growth must keep counting and never shrink.
 */
export interface Growth {
  /** Solved tasks so far (a hint does not matter). */
  solved: number
  /** `solved` when the child last saw Klíček, so the next visit can show the change. */
  seen: number
  /** Newest attempt already counted; later attempts in the history are new. */
  last: AttemptMark | null
}

export const GROWTH_KEY = 'clevee.growth.v1'

const EMPTY: Growth = { solved: 0, seen: 0, last: null }

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0

function isMark(v: unknown): v is AttemptMark {
  if (typeof v !== 'object' || v === null) return false
  const m = v as Record<string, unknown>
  return typeof m.gameId === 'string' && Number.isFinite(m.seed) && Number.isFinite(m.at)
}

const sameAttempt = (a: Attempt, m: AttemptMark) => a.gameId === m.gameId && a.seed === m.seed && a.at === m.at

/** Stored growth, or `null` when missing or unreadable. */
export function loadGrowth(storage: AttemptStorage): Growth | null {
  try {
    const raw = storage.getItem(GROWTH_KEY)
    if (raw === null) return null
    const g: unknown = JSON.parse(raw)
    if (typeof g !== 'object' || g === null) return null
    const { solved, seen, last } = g as Record<string, unknown>
    if (!isCount(solved) || !isCount(seen) || !(last === null || isMark(last))) return null
    return { solved, seen: Math.min(seen, solved), last: last && { gameId: last.gameId, seed: last.seed, at: last.at } }
  } catch {
    return null
  }
}

/** Pure: adds the correct attempts in `history` that come after `growth.last`. */
export function countNew(growth: Growth, history: readonly Attempt[]): Growth {
  const { last } = growth
  let from = 0
  if (last) {
    for (let i = history.length - 1; i >= 0; i--) {
      const a = history[i]
      if (a && sameAttempt(a, last)) {
        from = i + 1
        break
      }
    }
  }
  const fresh = history.slice(from)
  const newest = fresh.at(-1)
  if (!newest) return growth
  return {
    ...growth,
    solved: growth.solved + fresh.filter((a) => a.correct).length,
    last: { gameId: newest.gameId, seed: newest.seed, at: newest.at },
  }
}

function save(storage: AttemptStorage, growth: Growth) {
  try {
    storage.setItem(GROWTH_KEY, JSON.stringify(growth))
  } catch {
    // Full or blocked storage: growth catches up from the history on a later sync.
  }
}

/**
 * Brings stored growth up to date with the attempt history and returns it.
 * Safe to call any number of times; never throws.
 */
export function syncGrowth(storage: AttemptStorage | null): Growth {
  if (!storage) return EMPTY
  const stored = loadGrowth(storage) ?? EMPTY
  const growth = countNew(stored, loadAttempts(storage))
  if (growth !== stored) save(storage, growth)
  return growth
}

/** Records that the child has now seen Klíček as grown as `growth`. */
export function markSeen(storage: AttemptStorage | null, growth: Growth) {
  if (storage && growth.seen !== growth.solved) save(storage, { ...growth, seen: growth.solved })
}
