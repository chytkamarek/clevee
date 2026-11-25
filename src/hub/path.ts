import type { Attempt } from '../games/core/attempts.ts'

/** Solved tasks on a stone before it counts as passed. Never shown to the child. */
export const PASS_THRESHOLD = 3

export interface Stone {
  /** Game difficulty this stone plays, from 1. */
  level: number
  passed: boolean
  /** Klíček stands here; the main button plays this level. */
  current: boolean
}

/**
 * Pure: the stones of one game's path from the attempt history.
 * A stone is passed once the child solved `PASS_THRESHOLD` tasks on it or on any later stone,
 * so stones never fade back when old attempts drop out of the trimmed history.
 * The current stone is the first one not passed, or the last one when all are passed.
 */
export function pathFor(gameId: string, levels: number, history: readonly Attempt[]): Stone[] {
  const count = Math.max(1, Math.floor(levels) || 1)
  const solved = new Array<number>(count).fill(0)
  for (const a of history) {
    if (a.gameId !== gameId || !a.correct || !Number.isInteger(a.difficulty)) continue
    if (a.difficulty < 1 || a.difficulty > count) continue
    solved[a.difficulty - 1] = (solved[a.difficulty - 1] ?? 0) + 1
  }
  let furthest = -1
  solved.forEach((n, i) => {
    if (n >= PASS_THRESHOLD) furthest = i
  })
  const current = Math.min(furthest + 1, count - 1)
  return solved.map((_, i) => ({ level: i + 1, passed: i <= furthest, current: i === current }))
}
