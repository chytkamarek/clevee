/** One grid cell; `r` grows downward, `c` to the right. */
export interface Cell {
  r: number
  c: number
}

export const cellKey = (cell: Cell) => `${cell.r},${cell.c}`

/** Shifts cells so the smallest row and column are 0, sorted row by row. */
export function normalize(cells: readonly Cell[]): Cell[] {
  if (cells.length === 0) return []
  const minR = Math.min(...cells.map((x) => x.r))
  const minC = Math.min(...cells.map((x) => x.c))
  return cells.map((x) => ({ r: x.r - minR, c: x.c - minC })).sort((a, b) => a.r - b.r || a.c - b.c)
}

/** Quarter turn clockwise, normalized. */
export function rotate(cells: readonly Cell[]): Cell[] {
  return normalize(cells.map(({ r, c }) => ({ r: c, c: -r })))
}

/** Mirror image along the vertical axis (left ↔ right), normalized. */
export function mirror(cells: readonly Cell[]): Cell[] {
  return normalize(cells.map(({ r, c }) => ({ r, c: -c })))
}

/** Mirror first (when asked), then `rotation` quarter turns clockwise. */
export function orient(cells: readonly Cell[], rotation: number, mirrored: boolean): Cell[] {
  let out = mirrored ? mirror(cells) : normalize(cells)
  for (let i = 0; i < ((rotation % 4) + 4) % 4; i++) out = rotate(out)
  return out
}

/** Identity of a shape regardless of where it lies on the grid. */
export const shapeKey = (cells: readonly Cell[]) => normalize(cells).map(cellKey).join(' ')

export const size = (cells: readonly Cell[]) => ({
  rows: cells.length === 0 ? 0 : Math.max(...cells.map((x) => x.r)) + 1,
  cols: cells.length === 0 ? 0 : Math.max(...cells.map((x) => x.c)) + 1,
})
