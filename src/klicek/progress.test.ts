import { describe, expect, it } from 'vitest'
import { ATTEMPTS_KEY, MAX_ATTEMPTS, saveAttempt, type Attempt, type AttemptStorage } from '../games/core/attempts.ts'
import { GROWTH_KEY, loadGrowth, markSeen, syncGrowth } from './progress.ts'

const memory = (initial: Record<string, string> = {}): AttemptStorage & { data: Map<string, string> } => {
  const data = new Map(Object.entries(initial))
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}

let clock = 1_700_000_000_000
const attempt = (over: Partial<Attempt> = {}): Attempt => ({
  gameId: 'dummy',
  difficulty: 1,
  seed: 1,
  correct: true,
  durationMs: 1000,
  hints: 0,
  at: (clock += 1000),
  ...over,
})

/** What the play screen does after each checked answer. */
const play = (storage: AttemptStorage, a: Attempt) => {
  saveAttempt(storage, a)
  return syncGrowth(storage)
}

describe('stored growth', () => {
  it('counts solved tasks, including ones solved with a hint, and skips misses', () => {
    const storage = memory()
    play(storage, attempt())
    play(storage, attempt({ hints: 2 }))
    expect(play(storage, attempt({ correct: false })).solved).toBe(2)
  })

  it('does not count the same attempt twice when synced again', () => {
    const storage = memory()
    play(storage, attempt())
    expect(syncGrowth(storage).solved).toBe(1)
    expect(syncGrowth(storage).solved).toBe(1)
  })

  it('keeps growing after the attempt history is trimmed to MAX_ATTEMPTS', () => {
    const storage = memory()
    const total = MAX_ATTEMPTS + 50
    for (let i = 0; i < total; i++) play(storage, attempt({ seed: i }))
    expect(syncGrowth(storage).solved).toBe(total)
  })

  it('never shrinks, even if the history is cleared', () => {
    const storage = memory()
    for (let i = 0; i < 5; i++) play(storage, attempt({ seed: i }))
    storage.data.set(ATTEMPTS_KEY, '[]')
    expect(syncGrowth(storage).solved).toBe(5)
    expect(play(storage, attempt()).solved).toBe(6)
  })

  it('picks up tasks solved before growth was stored', () => {
    const history = [attempt(), attempt({ correct: false }), attempt()]
    const storage = memory({ [ATTEMPTS_KEY]: JSON.stringify(history) })
    expect(syncGrowth(storage)).toMatchObject({ solved: 2, seen: 0 })
  })

  it('rebuilds a corrupt growth record from the history', () => {
    const storage = memory({ [ATTEMPTS_KEY]: JSON.stringify([attempt(), attempt()]), [GROWTH_KEY]: '{"solved":"lots"}' })
    expect(loadGrowth(storage)).toBeNull()
    expect(syncGrowth(storage).solved).toBe(2)
  })

  it.each([
    ['invalid JSON', '{not json'],
    ['negative count', '{"solved":-3,"seen":0,"last":null}'],
    ['fractional count', '{"solved":2.5,"seen":0,"last":null}'],
    ['broken marker', '{"solved":3,"seen":0,"last":{"gameId":1}}'],
    ['null', 'null'],
  ])('reads corrupt storage everywhere (%s) as nothing grown yet', (_, raw) => {
    const storage = memory({ [ATTEMPTS_KEY]: raw, [GROWTH_KEY]: raw })
    expect(syncGrowth(storage)).toEqual({ solved: 0, seen: 0, last: null })
  })

  it('does not throw when storage is blocked or missing', () => {
    const broken: AttemptStorage = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(syncGrowth(broken).solved).toBe(0)
    expect(syncGrowth(null).solved).toBe(0)
    expect(() => markSeen(broken, { solved: 3, seen: 0, last: null })).not.toThrow()
  })

  it('remembers what the child last saw, so the next visit can show the change', () => {
    const storage = memory()
    play(storage, attempt())
    play(storage, attempt())
    const growth = syncGrowth(storage)
    expect(growth.seen).toBe(0)
    markSeen(storage, growth)
    expect(syncGrowth(storage)).toMatchObject({ solved: 2, seen: 2 })
    expect(play(storage, attempt())).toMatchObject({ solved: 3, seen: 2 })
  })

  it('marking as seen from an older read never undoes newer progress (another tab)', () => {
    const storage = memory()
    play(storage, attempt())
    const stale = syncGrowth(storage)
    play(storage, attempt())
    play(storage, attempt())
    markSeen(storage, stale)
    expect(loadGrowth(storage)).toMatchObject({ solved: 3, seen: 1 })
  })

  it('never reports having seen more than was solved', () => {
    const storage = memory({ [GROWTH_KEY]: '{"solved":2,"seen":9,"last":null}' })
    expect(loadGrowth(storage)).toEqual({ solved: 2, seen: 2, last: null })
  })
})
