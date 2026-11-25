import { describe, expect, it } from 'vitest'
import { generatePolyomino, LEVELS, levelFor, validatePolyomino, type PolyominoTask } from './puzzle.ts'
import type { Cell } from './shapes.ts'

const cells = (...rc: [number, number][]): Cell[] => rc.map(([r, c]) => ({ r, c }))

/**
 * 2×3 rectangle from two L-trominoes:
 *   A A B        A B B
 *   A B B   or   A A B  (another valid tiling)
 */
const task: PolyominoTask = {
  rows: 2,
  cols: 3,
  target: cells([0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]),
  pieces: [
    { id: 0, cells: cells([0, 0], [0, 1], [1, 0]) },
    { id: 1, cells: cells([0, 0], [0, 1], [1, 0]) },
  ],
  allowMirror: false,
  solution: [
    { pieceId: 0, rotation: 0, mirrored: false, row: 0, col: 0 },
    { pieceId: 1, rotation: 2, mirrored: false, row: 0, col: 1 },
  ],
}

describe('validatePolyomino', () => {
  it('accepts the stored solution', () => {
    expect(validatePolyomino(task, task.solution)).toBe(true)
  })

  it('accepts another valid tiling than the generator’s', () => {
    expect(
      validatePolyomino(task, [
        { pieceId: 1, rotation: 3, mirrored: false, row: 0, col: 0 },
        { pieceId: 0, rotation: 1, mirrored: false, row: 0, col: 1 },
      ]),
    ).toBe(true)
  })

  it('rejects overlapping pieces', () => {
    expect(
      validatePolyomino(task, [
        { pieceId: 0, rotation: 0, mirrored: false, row: 0, col: 0 },
        { pieceId: 1, rotation: 0, mirrored: false, row: 0, col: 1 },
      ]),
    ).toBe(false)
  })

  it('rejects a piece sticking out of the shape', () => {
    expect(
      validatePolyomino(task, [
        { pieceId: 0, rotation: 0, mirrored: false, row: 0, col: 0 },
        { pieceId: 1, rotation: 2, mirrored: false, row: 0, col: 2 },
      ]),
    ).toBe(false)
  })

  it('rejects an uncovered cell (a piece left out)', () => {
    expect(validatePolyomino(task, [task.solution[0]!])).toBe(false)
  })

  it('rejects a piece used twice, an unknown piece and a bad rotation', () => {
    const [a, b] = task.solution as [(typeof task.solution)[0], (typeof task.solution)[0]]
    expect(validatePolyomino(task, [a, { ...b, pieceId: 0 }])).toBe(false)
    expect(validatePolyomino(task, [a, { ...b, pieceId: 7 }])).toBe(false)
    expect(validatePolyomino(task, [a, { ...b, rotation: 6 }])).toBe(false)
  })

  it('rejects mirroring where the level does not allow it, accepts it where it does', () => {
    // A mirrored L-tromino turned once covers the same cells as rotation 2
    const flipped = { pieceId: 1, rotation: 1, mirrored: true, row: 0, col: 1 }
    expect(validatePolyomino(task, [task.solution[0]!, flipped])).toBe(false)
    expect(validatePolyomino({ ...task, allowMirror: true }, [task.solution[0]!, flipped])).toBe(true)
  })
})

describe('generatePolyomino', () => {
  const seeds = Array.from({ length: 300 }, (_, i) => i * 7919 + 1)

  it.each(LEVELS.map((_, i) => i + 1))('level %i: piece area = shape area and the stored solution is valid', (level) => {
    for (const seed of seeds) {
      const t = generatePolyomino(level, seed)
      const area = t.pieces.reduce((sum, p) => sum + p.cells.length, 0)
      expect(area).toBe(t.target.length)
      expect(new Set(t.target.map((c) => `${c.r},${c.c}`)).size).toBe(t.target.length)
      expect(t.target.every((c) => c.r >= 0 && c.c >= 0 && c.r < t.rows && c.c < t.cols)).toBe(true)
      expect(validatePolyomino(t, t.solution)).toBe(true)
    }
  })

  it('is deterministic for a seed', () => {
    expect(generatePolyomino(3, 42)).toEqual(generatePolyomino(3, 42))
    expect(generatePolyomino(3, 42)).not.toEqual(generatePolyomino(3, 43))
  })

  it('difficulty sets piece count, piece sizes and mirroring', () => {
    for (const [i, level] of LEVELS.entries()) {
      const t = generatePolyomino(i + 1, 5)
      expect(t.pieces).toHaveLength(level.pieces)
      expect(t.pieces.every((p) => level.sizes.includes(p.cells.length))).toBe(true)
      expect(t.allowMirror).toBe(level.allowMirror)
    }
    expect(LEVELS[0]!.allowMirror).toBe(false)
    expect(LEVELS.at(-1)!.allowMirror).toBe(true)
    // Shapes get bigger with difficulty
    const area = (d: number) => generatePolyomino(d, 9).target.length
    expect(area(1)).toBeLessThan(area(3))
    expect(area(3)).toBeLessThan(area(5))
  })

  it('without mirroring the solution never needs a flip', () => {
    for (const seed of seeds) {
      for (const d of [1, 2, 3]) expect(generatePolyomino(d, seed).solution.every((p) => !p.mirrored)).toBe(true)
    }
  })

  it('clamps out-of-range difficulty', () => {
    expect(levelFor(0)).toBe(LEVELS[0])
    expect(levelFor(99)).toBe(LEVELS.at(-1))
  })
})
