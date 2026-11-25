import { describe, expect, it } from 'vitest'
import { ATTEMPTS_KEY, MAX_ATTEMPTS, loadAttempts, saveAttempt, type Attempt, type AttemptStorage } from './attempts.ts'

const memory = (initial?: string): AttemptStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>(initial === undefined ? [] : [[ATTEMPTS_KEY, initial]])
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  }
}

const attempt = (over: Partial<Attempt> = {}): Attempt => ({
  gameId: 'dummy',
  difficulty: 1,
  seed: 3,
  correct: true,
  durationMs: 1200,
  hints: 1,
  at: 1_700_000_000_000,
  ...over,
})

describe('attempt history', () => {
  it('is empty when nothing is stored', () => {
    expect(loadAttempts(memory())).toEqual([])
  })

  it('saves attempts and loads them back in order', () => {
    const storage = memory()
    expect(saveAttempt(storage, attempt())).toBe(true)
    saveAttempt(storage, attempt({ correct: false, seed: 4 }))
    expect(loadAttempts(storage)).toEqual([attempt(), attempt({ correct: false, seed: 4 })])
  })

  it.each([
    ['invalid JSON', '{not json'],
    ['not an array', '{"gameId":"x"}'],
    ['null', 'null'],
  ])('reads corrupt data (%s) as empty history', (_, raw) => {
    expect(loadAttempts(memory(raw))).toEqual([])
  })

  it('keeps the valid records when one record is malformed, also across the next save', () => {
    const storage = memory(JSON.stringify([attempt(), { gameId: 'x', correct: 'yes' }, attempt({ seed: 4 })]))
    expect(loadAttempts(storage)).toEqual([attempt(), attempt({ seed: 4 })])
    saveAttempt(storage, attempt({ seed: 5 }))
    expect(loadAttempts(storage).map((a) => a.seed)).toEqual([3, 4, 5])
  })

  it('keeps only the newest MAX_ATTEMPTS attempts', () => {
    const storage = memory(JSON.stringify(Array.from({ length: MAX_ATTEMPTS }, (_, i) => attempt({ seed: i }))))
    saveAttempt(storage, attempt({ seed: -1 }))
    const all = loadAttempts(storage)
    expect(all).toHaveLength(MAX_ATTEMPTS)
    expect(all[0]?.seed).toBe(1)
    expect(all.at(-1)?.seed).toBe(-1)
  })

  it('replaces corrupt data with a valid history on the next save', () => {
    const storage = memory('{not json')
    saveAttempt(storage, attempt())
    expect(loadAttempts(storage)).toEqual([attempt()])
  })

  it('does not throw when storage refuses to write or read', () => {
    const broken: AttemptStorage = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(loadAttempts(broken)).toEqual([])
    expect(saveAttempt(broken, attempt())).toBe(false)
  })
})
