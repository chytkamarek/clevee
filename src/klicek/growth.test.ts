import { describe, expect, it } from 'vitest'
import { EXTRAS_PER_PHASE, PHASE_COUNT, PHASE_THRESHOLDS, mascotLabel, phaseFor, stageFor } from './growth.ts'

describe('phaseFor', () => {
  it('starts at phase 1 with nothing solved', () => {
    expect(phaseFor(0)).toBe(1)
  })

  it('switches exactly on each threshold, not one task earlier', () => {
    PHASE_THRESHOLDS.forEach((threshold, i) => {
      expect(phaseFor(threshold), `at ${threshold}`).toBe(i + 1)
      if (i > 0) expect(phaseFor(threshold - 1), `below ${threshold}`).toBe(i)
    })
  })

  it('stays at the last phase past the last threshold', () => {
    const last = PHASE_THRESHOLDS[PHASE_THRESHOLDS.length - 1] ?? 0
    expect(phaseFor(last + 1)).toBe(PHASE_COUNT)
    expect(phaseFor(100_000)).toBe(PHASE_COUNT)
  })

  it('reads nonsense counts as phase 1', () => {
    for (const n of [-5, Number.NaN, Number.POSITIVE_INFINITY]) expect(phaseFor(n)).toBe(1)
  })

  it('has 9 rising thresholds starting at 0', () => {
    expect(PHASE_THRESHOLDS).toHaveLength(PHASE_COUNT)
    expect(PHASE_COUNT).toBe(9)
    expect(PHASE_THRESHOLDS[0]).toBe(0)
    PHASE_THRESHOLDS.slice(1).forEach((t, i) => expect(t).toBeGreaterThan(PHASE_THRESHOLDS[i] ?? 0))
  })
})

describe('stageFor — small things growing within a phase', () => {
  it('has none at the start of every phase', () => {
    for (const t of PHASE_THRESHOLDS) expect(stageFor(t).extras, `at ${t}`).toBe(0)
  })

  it('adds them as progress goes on, never takes one away, and stays within the cap', () => {
    for (let phase = 1; phase < PHASE_COUNT; phase++) {
      const start = PHASE_THRESHOLDS[phase - 1] ?? 0
      const end = PHASE_THRESHOLDS[phase] ?? 0
      const counts = Array.from({ length: end - start }, (_, i) => stageFor(start + i).extras)
      counts.slice(1).forEach((c, i) => expect(c).toBeGreaterThanOrEqual(counts[i] ?? 0))
      expect(Math.max(...counts), `phase ${phase}`).toBeGreaterThan(0)
      expect(Math.max(...counts)).toBeLessThanOrEqual(EXTRAS_PER_PHASE)
    }
  })

  it('no longer changes once the apple tree is grown', () => {
    const last = PHASE_THRESHOLDS[PHASE_COUNT - 1] ?? 0
    const grown = stageFor(last)
    for (const n of [last + 1, last + 10, last + 1000]) expect(stageFor(n)).toEqual(grown)
  })
})

describe('mascotLabel', () => {
  it('names every phase for a screen reader, in Czech and English', () => {
    const cs = Array.from({ length: PHASE_COUNT }, (_, i) => mascotLabel(i + 1, 'cs'))
    expect(cs).toEqual([
      'Klíček, semínko',
      'Klíček s prvními lístky',
      'Klíček, sazenička',
      'Klíček zakořeňuje',
      'Klíček, proutek',
      'Klíček, mladý stromek',
      'Klíček, stromek',
      'Klíček kvete',
      'Klíček, jabloň s jablíčky',
    ])
    const en = Array.from({ length: PHASE_COUNT }, (_, i) => mascotLabel(i + 1, 'en'))
    expect(new Set(en).size).toBe(PHASE_COUNT)
    for (const label of [...cs, ...en]) expect(label).not.toMatch(/[!\d]/)
  })
})
