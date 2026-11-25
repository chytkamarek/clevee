import { describe, expect, it } from 'vitest'
import { sessionReducer, startSession, type SessionConfig, type SessionState } from './session.ts'
import { dummyGame } from './testing/dummyGame.tsx'

const config: SessionConfig = { game: dummyGame, difficulty: 2, locale: 'cs' }
const run = (state: SessionState, ...actions: Parameters<typeof sessionReducer>[2][]) =>
  actions.reduce((s, a) => sessionReducer(config, s, a), state)

describe('play session', () => {
  it('starts with a task generated from difficulty and seed', () => {
    const s = startSession(config, 5, 1000)
    expect(s).toMatchObject({ phase: 'answering', task: { n: 5, difficulty: 2 }, answer: null, hints: 0 })
  })

  it('happy path: answer → check → correct result with an attempt record', () => {
    const s = run(startSession(config, 5, 1000), { type: 'answer', answer: 6 }, { type: 'check', now: 4000 })
    expect(s.phase).toBe('result')
    if (s.phase !== 'result') return
    expect(s.correct).toBe(true)
    expect(s.attempt).toEqual({
      gameId: 'dummy',
      difficulty: 2,
      seed: 5,
      correct: true,
      durationMs: 3000,
      hints: 0,
      at: 4000,
    })
  })

  it('wrong answer → incorrect result; hints are counted', () => {
    const s = run(
      startSession(config, 5, 0),
      { type: 'hint' },
      { type: 'hint' },
      { type: 'answer', answer: 7 },
      { type: 'check', now: 10 },
    )
    expect(s.phase === 'result' && s.correct).toBe(false)
    expect(s.phase === 'result' && s.attempt).toMatchObject({ correct: false, hints: 2 })
  })

  it('cannot check without an answer', () => {
    const s = startSession(config, 5, 0)
    expect(sessionReducer(config, s, { type: 'check', now: 1 })).toBe(s)
  })

  it('ignores answers and hints once the result is shown', () => {
    const shown = run(startSession(config, 5, 0), { type: 'answer', answer: 6 }, { type: 'check', now: 1 })
    expect(run(shown, { type: 'answer', answer: 1 }, { type: 'hint' })).toBe(shown)
  })

  it('next task: fresh task from the new seed, cleared answer and hints', () => {
    const s = run(
      startSession(config, 5, 0),
      { type: 'hint' },
      { type: 'answer', answer: 6 },
      { type: 'check', now: 1 },
      { type: 'next', seed: 9, now: 50 },
    )
    expect(s).toEqual({ phase: 'answering', task: { n: 9, difficulty: 2 }, seed: 9, answer: null, hints: 0, startedAt: 50 })
  })

  it('next is ignored before the answer is checked', () => {
    const s = startSession(config, 5, 0)
    expect(sessionReducer(config, s, { type: 'next', seed: 9, now: 1 })).toBe(s)
  })
})
