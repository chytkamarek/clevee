import { render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { dummyGame } from '../games/core/testing/dummyGame.tsx'
import { Places } from './Home.tsx'

afterEach(() => {
  window.location.hash = ''
})

describe('Places', () => {
  it('each game is one whole tile, named for screen readers, opening its path', () => {
    render(<Places games={[{ ...dummyGame, module: 'space' }]} />)
    const tile = within(screen.getByRole('region', { name: 'Prostor' })).getByRole('link', { name: 'Testovací hra' })
    expect(tile).toHaveClass('tile')
    tile.focus()
    expect(tile).toHaveFocus()
    expect(tile).toHaveAttribute('href', '#/hra/dummy')
  })

  it('empty places show a sleeping Klíček, not a list', () => {
    render(<Places games={[dummyGame]} />)
    expect(within(screen.getByRole('region', { name: 'Jazyk' })).getByRole('img', { name: /spí/ })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Matematika' })).queryByRole('img', { name: /spí/ })).toBeNull()
  })
})
