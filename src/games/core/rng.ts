/** Deterministic pseudo-random generator: the same seed always yields the same sequence. */
export interface Rng {
  /** Float in [0, 1). */
  next(): number
  /** Integer in [min, max], both inclusive. */
  int(min: number, max: number): number
  /** One element of a non-empty array. */
  pick<T>(items: readonly T[]): T
  /** New array with the items in random order (the input is not changed). */
  shuffle<T>(items: readonly T[]): T[]
}

/** mulberry32 — small, fast, good enough for generating puzzles. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (min: number, max: number) => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`Neplatný rozsah ${min}..${max}`)
    }
    return min + Math.floor(next() * (max - min + 1))
  }

  return {
    next,
    int,
    pick(items) {
      if (items.length === 0) throw new RangeError('Nelze vybrat z prázdného pole')
      return items[int(0, items.length - 1)] as (typeof items)[number]
    },
    shuffle(items) {
      const out = [...items]
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(0, i)
        ;[out[i], out[j]] = [out[j] as (typeof out)[number], out[i] as (typeof out)[number]]
      }
      return out
    },
  }
}

/** Fresh 32-bit seed for a new task. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 4294967296) >>> 0
}
