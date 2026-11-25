import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { loadGrowth } from '../../klicek/progress.ts'
import { loadAttempts, type AttemptStorage } from './attempts.ts'
import { PlayScreen } from './PlayScreen.tsx'
import type { SpeechPort } from './speech.ts'
import { fakePort } from './testing/fakeSpeech.ts'
import { dummyGame } from './testing/dummyGame.tsx'

const setup = ({ speech = null, game = dummyGame }: { speech?: SpeechPort | null; game?: typeof dummyGame } = {}) => {
  const data = new Map<string, string>()
  const storage: AttemptStorage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
  const seeds = [10, 20, 30]
  let clock = 1000
  render(
    <PlayScreen
      game={game}
      speech={speech}
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

  describe('reading the task aloud', () => {
    const readButton = () => screen.queryByRole('button', { name: 'Přečíst zadání' })

    it('reads the task in its language', () => {
      const { port } = fakePort()
      setup({ speech: port })
      fireEvent.click(readButton()!)
      expect(port.speak).toHaveBeenCalledWith('Úloha 10', { lang: 'cs-CZ' })
    })

    it('stops reading on the next task and reads the new one', () => {
      const { port } = fakePort()
      setup({ speech: port })
      fireEvent.click(readButton()!)
      answer('11')
      fireEvent.click(screen.getByRole('button', { name: 'Zkontrolovat' }))
      expect(port.cancel).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: 'Další úloha' }))
      expect(port.cancel).toHaveBeenCalledTimes(1)
      fireEvent.click(readButton()!)
      expect(port.speak).toHaveBeenLastCalledWith('Úloha 20', { lang: 'cs-CZ' })
    })

    it('has no button without speech, without a voice for the language, or for a game with nothing to read', () => {
      setup()
      expect(readButton()).toBeNull()
      cleanup()
      setup({ speech: fakePort([{ lang: 'en-US' }]).port })
      expect(readButton()).toBeNull()
      cleanup()
      setup({ speech: fakePort().port, game: { ...dummyGame, speech: undefined } })
      expect(readButton()).toBeNull()
    })
  })
})
