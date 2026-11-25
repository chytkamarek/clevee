import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { loadGrowth } from '../../klicek/progress.ts'
import { loadAttempts, type AttemptStorage } from './attempts.ts'
import { PlayScreen } from './PlayScreen.tsx'
import { dummyGame } from './testing/dummyGame.tsx'

const setup = () => {
  const data = new Map<string, string>()
  const storage: AttemptStorage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
  const seeds = [10, 20, 30]
  let clock = 1000
  render(
    <PlayScreen
      game={dummyGame}
      difficulty={3}
      storage={storage}
      nextSeed={() => seeds.shift() ?? 0}
      now={() => (clock += 500)}
    />,
  )
  return { storage }
}

const answer = (value: string) => fireEvent.change(screen.getByLabelText('Odpověď'), { target: { value } })

describe('PlayScreen', () => {
  it('runs task → check → result → next task and stores each attempt', () => {
    const { storage } = setup()
    expect(screen.getByRole('heading', { name: 'Testovací hra' })).toBeInTheDocument()
    expect(screen.getByText('Úloha 10')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zkontrolovat' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Nápověda' }))
    answer('11')
    fireEvent.click(screen.getByRole('button', { name: 'Zkontrolovat' }))
    expect(screen.getByRole('status')).toHaveTextContent('Správně.')

    fireEvent.click(screen.getByRole('button', { name: 'Další úloha' }))
    expect(screen.getByText('Úloha 20')).toBeInTheDocument()
    expect(screen.getByLabelText('Odpověď')).toHaveValue('')
    expect(screen.getByRole('status')).toHaveTextContent('')

    answer('5')
    fireEvent.click(screen.getByRole('button', { name: 'Zkontrolovat' }))
    expect(screen.getByRole('status')).toHaveTextContent('Ještě to nesedí.')

    expect(loadAttempts(storage)).toEqual([
      { gameId: 'dummy', difficulty: 3, seed: 10, correct: true, durationMs: 500, hints: 1, at: 2000 },
      { gameId: 'dummy', difficulty: 3, seed: 20, correct: false, durationMs: 500, hints: 0, at: 3000 },
    ])
    // Klíček grows from the solved task only
    expect(loadGrowth(storage)?.solved).toBe(1)
  })

  it('submits with Enter from the answer field', () => {
    setup()
    answer('11')
    fireEvent.submit(screen.getByLabelText('Odpověď').closest('form') as HTMLFormElement)
    expect(screen.getByRole('status')).toHaveTextContent('Správně.')
  })
})
