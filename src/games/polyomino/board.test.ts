import { describe, expect, it } from 'vitest'
import { cellAt, initialBoard, mirrorPiece, placePiece, rotatePiece, toAnswer, toTray } from './board.ts'
import { validatePolyomino, type PolyominoTask } from './puzzle.ts'
import type { Cell } from './shapes.ts'

const cells = (...rc: [number, number][]): Cell[] => rc.map(([r, c]) => ({ r, c }))

// 2×3 rectangle from two L-trominoes (see puzzle.test.ts)
const task: PolyominoTask = {
  rows: 2,
  cols: 3,
  target: cells([0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]),
  pieces: [
    { id: 0, cells: cells([0, 0], [0, 1], [1, 0]) },
    { id: 1, cells: cells([0, 0], [0, 1], [1, 0]) },
  ],
  allowMirror: false,
  solution: [],
}

describe('board', () => {
  it('starts with every piece in the tray and no answer', () => {
    const board = initialBoard(task)
    expect(board.every((p) => p.at === null && p.rotation === 0 && !p.mirrored)).toBe(true)
    expect(toAnswer(board)).toBeNull()
  })

  it('places a piece onto free cells of the shape', () => {
    const board = placePiece(task, initialBoard(task), 0, 0, 0)
    expect(board[0]!.at).toEqual({ row: 0, col: 0 })
    expect(toAnswer(board)).toBeNull()
  })

  it('refuses a drop that sticks out of the shape or overlaps — the piece stays in the tray', () => {
    let board = placePiece(task, initialBoard(task), 0, 1, 2)
    expect(board[0]!.at).toBeNull()
    board = placePiece(task, board, 0, 0, 0)
    board = placePiece(task, board, 1, 0, 1)
    expect(board[1]!.at).toBeNull()
  })

  it('a refused move sends a placed piece back to the tray', () => {
    let board = placePiece(task, initialBoard(task), 0, 0, 0)
    board = placePiece(task, board, 0, 1, 2)
    expect(board[0]!.at).toBeNull()
  })

  it('rotates in place, or back to the tray when the turned piece no longer fits', () => {
    let board = placePiece(task, initialBoard(task), 1, 0, 1)
    board = rotatePiece(task, board, 1) // rotation 1 at (0,1): cells (0,1),(0,2),(1,2) — fits
    expect(board[1]).toMatchObject({ rotation: 1, at: { row: 0, col: 1 } })
    board = placePiece(task, board, 0, 0, 0) // (0,0),(0,1)… overlaps → refused
    expect(board[0]!.at).toBeNull()
    board = rotatePiece(task, board, 1)
    board = rotatePiece(task, board, 1)
    board = rotatePiece(task, board, 1) // back to rotation 0 at (0,1): fits
    expect(board[1]).toMatchObject({ rotation: 0, at: { row: 0, col: 1 } })
    board = toTray(placePiece(task, board, 1, 0, 0), 1)
    expect(board[1]!.at).toBeNull()
  })

  it('rotation that would stick out sends the piece to the tray', () => {
    let board = placePiece(task, initialBoard(task), 0, 0, 1) // (0,1),(0,2),(1,1)
    board = rotatePiece(task, board, 0) // rotation 1 at (0,1): (0,1),(0,2),(1,2) fits
    board = rotatePiece(task, board, 0) // rotation 2 at (0,1): (0,2),(1,1),(1,2) fits
    board = rotatePiece(task, board, 0) // rotation 3 at (0,1): (0,1),(1,1),(1,2) fits
    expect(board[0]!.at).not.toBeNull()
    board = placePiece(task, board, 0, 0, 0) // rotation 3 at (0,0): (0,0),(1,0),(1,1)
    board = placePiece(task, board, 1, 0, 1) // rotation 0 at (0,1): (0,1),(0,2),(1,1) overlaps → tray
    expect(board[1]!.at).toBeNull()
    board = placePiece(task, board, 0, 0, 1) // rotation 3 at (0,1): (0,1),(1,1),(1,2)
    board = rotatePiece(task, board, 0) // rotation 0 at (0,1): (0,1),(0,2),(1,1) fits
    board = placePiece(task, board, 0, 1, 1) // rotation 0 at (1,1): (1,1),(1,2),(2,1) sticks out
    expect(board[0]!.at).toBeNull()
  })

  it('mirrors only where the level allows it', () => {
    const board = initialBoard(task)
    expect(mirrorPiece(task, board, 0)).toBe(board)
    expect(mirrorPiece({ ...task, allowMirror: true }, board, 0)[0]!.mirrored).toBe(true)
  })

  it('gives a valid answer once the shape is filled', () => {
    let board = placePiece(task, initialBoard(task), 0, 0, 0)
    board = rotatePiece(task, board, 1)
    board = rotatePiece(task, board, 1)
    board = placePiece(task, board, 1, 0, 1)
    const answer = toAnswer(board)
    expect(answer).not.toBeNull()
    expect(validatePolyomino(task, answer!)).toBe(true)
  })

  it('maps a point to the board cell under it', () => {
    expect(cellAt(130, 75, { left: 100, top: 10 }, 32)).toEqual({ row: 2, col: 0 })
    expect(cellAt(90, 5, { left: 100, top: 10 }, 32)).toEqual({ row: -1, col: -1 })
  })
})
