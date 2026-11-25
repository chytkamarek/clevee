import { describe, expect, it } from 'vitest'
import { createRng } from './rng.ts'

const take = (seed: number, n = 20) => {
  const rng = createRng(seed)
  return Array.from({ length: n }, () => rng.next())
}

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    expect(take(42)).toEqual(take(42))
  })

  it('gives a different sequence for a different seed', () => {
    expect(take(42)).not.toEqual(take(43))
  })

  it('stays in [0, 1)', () => {
    for (const x of take(7, 1000)) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })

  it('int covers the whole inclusive range and nothing outside it', () => {
    const rng = createRng(1)
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(rng.int(3, 6))
    expect([...seen].sort()).toEqual([3, 4, 5, 6])
  })

  it('int rejects an inverted range', () => {
    expect(() => createRng(1).int(5, 2)).toThrow(RangeError)
  })

  it('shuffle is a deterministic permutation and leaves the input alone', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const a = createRng(9).shuffle(input)
    expect(a).toEqual(createRng(9).shuffle(input))
    expect([...a].sort()).toEqual(input)
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('pick rejects an empty array', () => {
    expect(() => createRng(1).pick([])).toThrow(RangeError)
  })
})
