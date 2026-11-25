import { describe, expect, it } from 'vitest'
import type { Attempt } from '../games/core/attempts.ts'
import { PASS_THRESHOLD, pathFor } from './path.ts'

let at = 0
const tries = (n: number, difficulty: number, extra: Partial<Attempt> = {}): Attempt[] =>
  Array.from({ length: n }, () => ({
    gameId: 'g', difficulty, seed: ++at, correct: true, durationMs: 1, hints: 0, at, ...extra,
  }))

const view = (stones: ReturnType<typeof pathFor>) =>
  stones.map((s) => `${s.level}${s.passed ? 'P' : '-'}${s.current ? '*' : ''}`).join(' ')

describe('pathFor', () => {
  it('threshold is a few tasks', () => {
    expect(PASS_THRESHOLD).toBe(3)
  })

  it('no history: first stone is current, none passed', () => {
    expect(view(pathFor('g', 4, []))).toBe('1-* 2- 3- 4-')
  })

  it('a stone in progress stays current until enough tasks are solved', () => {
    expect(view(pathFor('g', 4, tries(2, 1)))).toBe('1-* 2- 3- 4-')
    expect(view(pathFor('g', 4, [...tries(3, 1), ...tries(1, 2)]))).toBe('1P 2-* 3- 4-')
  })

  it('wrong answers do not count, hints do not matter', () => {
    expect(view(pathFor('g', 3, [...tries(5, 1, { correct: false }), ...tries(2, 1)]))).toBe('1-* 2- 3-')
    expect(view(pathFor('g', 3, [...tries(2, 1), ...tries(1, 1, { hints: 3 })]))).toBe('1P 2-* 3-')
  })

  it('all passed: Klíček stays on the last stone', () => {
    expect(view(pathFor('g', 3, [...tries(3, 1), ...tries(3, 2), ...tries(4, 3)]))).toBe('1P 2P 3P*')
  })

  it("other games' attempts do not count", () => {
    expect(view(pathFor('g', 2, tries(5, 1, { gameId: 'other' })))).toBe('1-* 2-')
  })

  it('a passed later stone keeps earlier stones passed (old attempts trimmed away)', () => {
    expect(view(pathFor('g', 4, tries(3, 3)))).toBe('1P 2P 3P 4-*')
  })

  it('ignores levels the game does not have', () => {
    expect(view(pathFor('g', 2, [...tries(3, 5), ...tries(3, 0), ...tries(3, 1.5)]))).toBe('1-* 2-')
  })

  it('a game with a bad level count still has one stone', () => {
    expect(view(pathFor('g', 0, []))).toBe('1-*')
  })
})
