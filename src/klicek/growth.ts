import type { Locale } from '../games/core/types.ts'

/** Growth phase of Klíček, 1 (seed) to 9 (apple tree). */
export type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export const PHASE_COUNT = 9

/**
 * Solved tasks needed to reach each phase (index 0 = phase 1).
 * The one place to tune how fast Klíček grows.
 */
export const PHASE_THRESHOLDS: readonly number[] = [0, 3, 8, 15, 25, 40, 60, 85, 120]

/** Small things (leaves, blossoms) that appear one by one within a phase. */
export const EXTRAS_PER_PHASE = 3

/** What the drawing shows: the phase and how many small things have grown in it. */
export interface Stage {
  phase: Phase
  extras: number
}

const valid = (solved: number) => (Number.isFinite(solved) && solved > 0 ? Math.floor(solved) : 0)

export function phaseFor(solved: number): Phase {
  const n = valid(solved)
  let phase = 1
  while (phase < PHASE_COUNT && n >= (PHASE_THRESHOLDS[phase] ?? Infinity)) phase++
  return phase as Phase
}

/** Pure: stage for a number of solved tasks. The grown apple tree (phase 9) no longer changes. */
export function stageFor(solved: number): Stage {
  const n = valid(solved)
  const phase = phaseFor(n)
  if (phase === PHASE_COUNT) return { phase, extras: 0 }
  const start = PHASE_THRESHOLDS[phase - 1] ?? 0
  const end = PHASE_THRESHOLDS[phase] ?? start + 1
  const extras = Math.floor(((n - start) / (end - start)) * (EXTRAS_PER_PHASE + 1))
  return { phase, extras: Math.min(extras, EXTRAS_PER_PHASE) }
}

const labels: Record<Locale, readonly string[]> = {
  cs: [
    'Klíček, semínko',
    'Klíček s prvními lístky',
    'Klíček, sazenička',
    'Klíček zakořeňuje',
    'Klíček, proutek',
    'Klíček, mladý stromek',
    'Klíček, stromek',
    'Klíček kvete',
    'Klíček, jabloň s jablíčky',
  ],
  en: [
    'Klíček, a seed',
    'Klíček with its first leaves',
    'Klíček, a seedling',
    'Klíček taking root',
    'Klíček, a twig',
    'Klíček, a young tree',
    'Klíček, a little tree',
    'Klíček in bloom',
    'Klíček, an apple tree with apples',
  ],
}

/** Screen-reader description of the mascot in a phase. */
export function mascotLabel(phase: number, locale: Locale): string {
  return labels[locale][phase - 1] ?? labels[locale][0] ?? ''
}
