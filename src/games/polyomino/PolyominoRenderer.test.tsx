import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlayScreen } from '../core/PlayScreen.tsx'
import type { Game } from '../core/types.ts'
import { polyominoGame } from './polyominoGame.ts'
import type { PolyominoAnswer, PolyominoTask } from './puzzle.ts'
import type { Cell } from './shapes.ts'

const cells = (...rc: [number, number][]): Cell[] => rc.map(([r, c]) => ({ r, c }))

// 1×4 strip from two horizontal dominoes
const strip: PolyominoTask = {
  rows: 1,
  cols: 4,
  target: cells([0, 0], [0, 1], [0, 2], [0, 3]),
  pieces: [
    { id: 0, cells: cells([0, 0], [0, 1]) },
    { id: 1, cells: cells([0, 0], [0, 1]) },
  ],
  allowMirror: false,
  solution: [],
}

const gameWith = (task: PolyominoTask): Game<PolyominoTask, PolyominoAnswer> => ({ ...polyominoGame, generate: () => task })

const CELL = 50
const BOARD = { left: 100, top: 100 }

/** jsdom has no layout: the board is at BOARD with 50 px cells, every piece box at (0, 0). */
function fakeLayout() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const isBoard = this.classList.contains('poly__board')
    const left = isBoard ? BOARD.left : 0
    const top = isBoard ? BOARD.top : 0
    const width = isBoard ? 4 * CELL : CELL
    return { left, top, width, height: CELL, right: left + width, bottom: top + CELL, x: left, y: top, toJSON: () => ({}) }
  })
}

const play = (task: PolyominoTask) =>
  render(<PlayScreen game={gameWith(task)} storage={null} nextSeed={() => 1} now={() => 0} />)

/** Drags the piece by a point 10 px inside it so its top-left corner lands on board cell `col`. */
function dragTo(name: string, col: number) {
  const piece = screen.getByRole('button', { name })
  const x = BOARD.left + col * CELL + 10
  const y = BOARD.top + 10
  fireEvent.pointerDown(piece, { pointerId: 1, isPrimary: true, clientX: 10, clientY: 10 })
  fireEvent.pointerMove(piece, { pointerId: 1, clientX: x, clientY: y })
  fireEvent.pointerUp(piece, { pointerId: 1, clientX: x, clientY: y })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PolyominoRenderer', () => {
  it('fills the shape by dragging, then the answer checks as correct', () => {
    fakeLayout()
    play(strip)
    const check = screen.getByRole('button', { name: 'Zkontrolovat' })
    expect(check).toBeDisabled()

    dragTo('Dílek 1', 0)
    expect(screen.getByRole('group', { name: 'Tvar k vyplnění' })).toContainElement(
      screen.getByRole('button', { name: 'Dílek 1' }),
    )
    expect(check).toBeDisabled()

    dragTo('Dílek 2', 2)
    expect(check).toBeEnabled()
    fireEvent.click(check)
    expect(screen.getByRole('status')).toHaveTextContent('Správně')
  })

  it('a drop that would overlap leaves the piece in the tray', () => {
    fakeLayout()
    play(strip)
    dragTo('Dílek 1', 1)
    dragTo('Dílek 2', 2)
    expect(screen.getByRole('group', { name: 'Dílky' })).toContainElement(screen.getByRole('button', { name: 'Dílek 2' }))
  })

  it('a tap turns the piece; the Turn button turns the selected one', () => {
    fakeLayout()
    play(strip)
    const turn = screen.getByRole('button', { name: /Otočit/ })
    expect(turn).toBeDisabled()

    const piece = screen.getByRole('button', { name: 'Dílek 1' })
    const shapeSize = () => {
      const shape = piece.querySelector('.poly__shape') as HTMLElement
      return [shape.style.width, shape.style.height]
    }
    expect(shapeSize()).toEqual(['calc(2 * var(--cell))', 'calc(1 * var(--cell))'])

    fireEvent.pointerDown(piece, { pointerId: 1, isPrimary: true, clientX: 10, clientY: 10 })
    fireEvent.pointerUp(piece, { pointerId: 1, clientX: 12, clientY: 11 })
    expect(shapeSize()).toEqual(['calc(1 * var(--cell))', 'calc(2 * var(--cell))'])
    expect(piece).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(turn)
    expect(shapeSize()).toEqual(['calc(2 * var(--cell))', 'calc(1 * var(--cell))'])
  })

  it('offers Flip only where the level allows mirroring', () => {
    play(strip)
    expect(screen.queryByRole('button', { name: /Překlopit/ })).not.toBeInTheDocument()
  })

  it('offers Flip on higher levels', () => {
    play({ ...strip, allowMirror: true })
    expect(screen.getByRole('button', { name: /Překlopit/ })).toBeInTheDocument()
  })

  it('can be finished from the keyboard: Enter lays a piece, arrows move it', () => {
    play(strip)
    const one = screen.getByRole('button', { name: 'Dílek 1' })
    one.focus()
    fireEvent.keyDown(one, { key: 'Enter' }) // first free spot: cells 0–1
    const board = screen.getByRole('group', { name: 'Tvar k vyplnění' })
    expect(board).toContainElement(screen.getByRole('button', { name: 'Dílek 1' }))
    expect(screen.getByRole('button', { name: 'Dílek 1' })).toHaveFocus()

    fireEvent.keyDown(screen.getByRole('button', { name: 'Dílek 1' }), { key: 'ArrowRight' }) // cells 1–2
    fireEvent.keyDown(screen.getByRole('button', { name: 'Dílek 1' }), { key: 'ArrowRight' }) // cells 2–3
    fireEvent.keyDown(screen.getByRole('button', { name: 'Dílek 2' }), { key: 'Enter' }) // cells 0–1
    expect(board).toContainElement(screen.getByRole('button', { name: 'Dílek 2' }))
    expect(screen.getByRole('button', { name: 'Zkontrolovat' })).toBeEnabled()
  })

  it('after checking, pieces cannot be dragged or turned', () => {
    fakeLayout()
    play(strip)
    dragTo('Dílek 1', 0)
    dragTo('Dílek 2', 2)
    fireEvent.click(screen.getByRole('button', { name: 'Zkontrolovat' }))
    dragTo('Dílek 2', 1)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Dílek 1' }), { key: 'r' })
    const board = screen.getByRole('group', { name: 'Tvar k vyplnění' })
    expect(board).toContainElement(screen.getByRole('button', { name: 'Dílek 2' }))
    expect(screen.getByRole('button', { name: /Otočit/ })).toBeDisabled()
    const shape = screen.getByRole('button', { name: 'Dílek 1' }).querySelector('.poly__shape') as HTMLElement
    expect(shape.style.width).toBe('calc(2 * var(--cell))')
  })
})
