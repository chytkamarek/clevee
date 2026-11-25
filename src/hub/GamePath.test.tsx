import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Attempt, AttemptStorage } from '../games/core/attempts.ts'
import { ATTEMPTS_KEY } from '../games/core/attempts.ts'
import { dummyGame } from '../games/core/testing/dummyGame.tsx'
import { GamePath } from './GamePath.tsx'

const memory = (attempts: Partial<Attempt>[]): AttemptStorage => {
  const data = new Map([[ATTEMPTS_KEY, JSON.stringify(attempts.map((a, i) => ({
    gameId: 'dummy', difficulty: 1, seed: i, correct: true, durationMs: 1, hints: 0, at: i + 1, ...a,
  })))]])
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}

afterEach(() => {
  window.location.hash = ''
})

describe('GamePath', () => {
  it('no history: first stone is current, the rest wait quietly without links', () => {
    render(<GamePath game={{ ...dummyGame, levels: 4 }} storage={null} />)
    const current = screen.getByRole('link', { name: /Kamínek 1, tady stojí Klíček/ })
    expect(current).toHaveAttribute('href', '#/hra/dummy/1')
    for (const n of [2, 3, 4]) {
      const stone = screen.getByRole('img', { name: `Kamínek ${n}, ještě před tebou` })
      expect(stone).toHaveClass('stone--ahead')
      expect(stone.tagName).toBe('SPAN')
    }
    expect(screen.getByRole('link', { name: 'Hrát' })).toHaveAttribute('href', '#/hra/dummy/1')
    expect(screen.getByRole('link', { name: 'Domů' })).toHaveAttribute('href', '#/')
  })

  it('passed stones are full, link to their own level; ▶ plays the current one', () => {
    const storage = memory([{ difficulty: 1 }, { difficulty: 1 }, { difficulty: 1 }, { difficulty: 2 }])
    render(<GamePath game={dummyGame} storage={storage} />)
    const passed = screen.getByRole('link', { name: 'Kamínek 1, prošlý, hrát znovu' })
    expect(passed).toHaveClass('stone--passed')
    expect(passed).not.toHaveClass('stone--ahead')
    expect(passed).toHaveAttribute('href', '#/hra/dummy/1')
    expect(screen.getByRole('link', { name: /Kamínek 2, tady stojí Klíček/ })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('link', { name: 'Hrát' })).toHaveAttribute('href', '#/hra/dummy/2')
  })

  it('never shows a number or count to the child', () => {
    const storage = memory([{ difficulty: 1 }, { difficulty: 1 }])
    const { container } = render(<GamePath game={dummyGame} storage={storage} />)
    expect(container.querySelector('main')?.textContent).not.toMatch(/\d/)
  })

  it('every control is a real link (keyboard-reachable) with a name; a passed stone plays its level', () => {
    const storage = memory([{ difficulty: 1 }, { difficulty: 1 }, { difficulty: 1 }])
    render(<GamePath game={dummyGame} storage={storage} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('aria-label'))).toEqual([
      'Domů',
      'Kamínek 1, prošlý, hrát znovu',
      'Kamínek 2, tady stojí Klíček, hrát',
      'Hrát',
    ])
    for (const l of links) expect(l).toHaveAttribute('href')
    const passed = links[1] as HTMLElement
    passed.focus()
    expect(passed).toHaveFocus()
    expect(passed).toHaveAttribute('href', '#/hra/dummy/1')
  })
})
