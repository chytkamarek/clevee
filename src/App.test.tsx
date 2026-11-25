import { act, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App.tsx'
import { createRegistry } from './games/core/registry.ts'
import { dummyGame } from './games/core/testing/dummyGame.tsx'
import { ATTEMPTS_KEY } from './games/core/attempts.ts'
import { GROWTH_KEY, loadGrowth } from './klicek/progress.ts'

const games = createRegistry([dummyGame])

afterEach(() => {
  window.location.hash = ''
  localStorage.clear()
})

describe('App', () => {
  const go = (hash: string) =>
    act(() => {
      window.location.hash = hash
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })

  it('shows three places, each with a sleeping Klíček when it has no games', () => {
    render(<App games={createRegistry([])} />)
    expect(screen.getByRole('heading', { level: 1, name: 'clevee' })).toBeInTheDocument()
    for (const name of ['Matematika', 'Jazyk', 'Prostor']) {
      const place = screen.getByRole('region', { name })
      expect(within(place).getByRole('img', { name: /Klíček tu spí/ })).toBeInTheDocument()
    }
  })

  it('puts a game into its place as a tile that opens its path, then plays a stone', () => {
    render(<App games={games} />)
    const math = screen.getByRole('region', { name: 'Matematika' })
    const tile = within(math).getByRole('link', { name: 'Testovací hra' })
    expect(within(screen.getByRole('region', { name: 'Prostor' })).queryByRole('link')).toBeNull()

    go(tile.getAttribute('href') ?? '')
    expect(screen.getByRole('heading', { name: 'Testovací hra' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(dummyGame.levels)

    go(screen.getByRole('link', { name: 'Hrát' }).getAttribute('href') ?? '')
    expect(screen.getByRole('button', { name: 'Zkontrolovat' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Zpět' })).toHaveAttribute('href', '#/hra/dummy')
  })

  it('plays the level from the URL, never past the last one', () => {
    window.location.hash = '#/hra/dummy/9'
    render(<App games={createRegistry([{ ...dummyGame, generate: (d: number) => ({ n: 100 + d, difficulty: d }) }])} />)
    expect(screen.getByText(`Úloha ${100 + dummyGame.levels}`)).toBeInTheDocument()
  })

  it('colours a stone after a few solved tasks on it', () => {
    const solved = Array.from({ length: 3 }, (_, i) => ({
      gameId: 'dummy', difficulty: 1, seed: i, correct: true, durationMs: 1, hints: 0, at: i + 1,
    }))
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(solved))
    window.location.hash = '#/hra/dummy'
    render(<App games={games} />)
    expect(screen.getByRole('link', { name: /Kamínek 1, prošlý/ })).toHaveClass('stone--passed')
    expect(screen.getByRole('link', { name: /Kamínek 2, tady stojí Klíček/ })).toHaveAttribute('aria-current', 'step')
  })

  it.each(['#/hra/neexistuje', '#/hra/neexistuje/1'])('says so for an unknown game id (%s)', (hash) => {
    window.location.hash = hash
    render(<App games={games} />)
    expect(screen.getByText('Tuhle hru neznám.')).toBeInTheDocument()
  })

  describe('Klíček on the home page', () => {
    it('starts as a seed', () => {
      render(<App games={games} />)
      expect(screen.getByRole('img', { name: 'Klíček, semínko' })).toBeInTheDocument()
    })

    it('grows from solved tasks in the stored history', () => {
      const solved = Array.from({ length: 40 }, (_, i) => ({
        gameId: 'dummy', difficulty: 1, seed: i, correct: true, durationMs: 1, hints: 0, at: i + 1,
      }))
      localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(solved))
      render(<App games={games} />)
      expect(screen.getByRole('img', { name: 'Klíček, mladý stromek' })).toBeInTheDocument()
      // Seen now, so the next visit does not repeat the change
      expect(loadGrowth(localStorage)).toMatchObject({ solved: 40, seen: 40 })
    })

    it('shows the last seen Klíček fading into the grown one', async () => {
      localStorage.setItem(GROWTH_KEY, JSON.stringify({ solved: 120, seen: 3, last: null }))
      const { container } = render(<App games={games} />)
      expect(screen.getByRole('img', { name: 'Klíček, jabloň s jablíčky' })).toBeInTheDocument()
      const layers = () =>
        [...container.querySelectorAll('.klicek svg')].map((s) => `${s.getAttribute('data-phase')} ${s.getAttribute('class')}`)
      expect(layers()).toEqual(['2 klicek__layer', '9 klicek__layer klicek__layer--hidden klicek__layer--after'])
      await waitFor(() =>
        expect(layers()).toEqual(['2 klicek__layer klicek__layer--hidden', '9 klicek__layer klicek__layer--after']),
      )
    })

    it('shows a single drawing when nothing changed since last time', () => {
      localStorage.setItem(GROWTH_KEY, JSON.stringify({ solved: 3, seen: 3, last: null }))
      const { container } = render(<App games={games} />)
      expect([...container.querySelectorAll('.klicek svg')].map((s) => s.getAttribute('class'))).toEqual(['klicek__layer'])
    })

    it('stays a seed and does not crash on corrupt storage', () => {
      localStorage.setItem(ATTEMPTS_KEY, '{oops')
      localStorage.setItem(GROWTH_KEY, '{oops')
      render(<App games={games} />)
      expect(screen.getByRole('img', { name: 'Klíček, semínko' })).toBeInTheDocument()
    })
  })
})
