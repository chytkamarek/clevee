import { describe, expect, it } from 'vitest'
import { mirror, normalize, orient, rotate, shapeKey, type Cell } from './shapes.ts'

const cells = (...rc: [number, number][]): Cell[] => rc.map(([r, c]) => ({ r, c }))

// L-tetromino, chiral: its mirror image is a different shape until flipped back
const L = cells([0, 0], [1, 0], [2, 0], [2, 1])

describe('shapes', () => {
  it('normalizes to the top-left corner, sorted', () => {
    expect(normalize(cells([5, 4], [3, 3]))).toEqual(cells([0, 0], [2, 1]))
  })

  it('rotates a quarter turn clockwise', () => {
    expect(rotate(cells([0, 0], [0, 1], [0, 2]))).toEqual(cells([0, 0], [1, 0], [2, 0]))
    expect(rotate(L)).toEqual(cells([0, 0], [0, 1], [0, 2], [1, 0]))
  })

  it('four rotations give back the original shape', () => {
    let out = L
    for (let i = 0; i < 4; i++) out = rotate(out)
    expect(out).toEqual(normalize(L))
    expect(orient(L, 4, false)).toEqual(normalize(L))
    for (let i = 1; i < 4; i++) expect(shapeKey(orient(L, i, false))).not.toBe(shapeKey(L))
  })

  it('mirrors left ↔ right; twice is the original; a mirrored L is no rotation of L', () => {
    expect(mirror(L)).toEqual(cells([0, 1], [1, 1], [2, 0], [2, 1]))
    expect(mirror(mirror(L))).toEqual(normalize(L))
    const rotations = [0, 1, 2, 3].map((r) => shapeKey(orient(L, r, false)))
    expect(rotations).not.toContain(shapeKey(mirror(L)))
    expect(orient(L, 0, true)).toEqual(mirror(L))
  })
})
