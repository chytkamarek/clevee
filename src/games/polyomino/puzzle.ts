import { createRng, type Rng } from '../core/rng.ts'
import { cellKey, normalize, orient, shapeKey, type Cell } from './shapes.ts'

/** Where one piece lies: its oriented shape with the top-left corner of its box at (row, col). */
export interface Placement {
  pieceId: number
  /** Quarter turns clockwise, 0–3. */
  rotation: number
  mirrored: boolean
  row: number
  col: number
}

export interface Piece {
  id: number
  /** Shape as the child first sees it (rotation 0, not mirrored), normalized. */
  cells: Cell[]
}

export interface PolyominoTask {
  rows: number
  cols: number
  /** Cells of the shape to fill, all within rows × cols. */
  target: Cell[]
  pieces: Piece[]
  allowMirror: boolean
  /** The generator's own tiling; any other valid one counts as well. */
  solution: Placement[]
}

/** All pieces placed; `null` in the renderer until then. */
export type PolyominoAnswer = Placement[]

interface Level {
  pieces: number
  sizes: readonly number[]
  allowMirror: boolean
  /** Box the shape is grown in; the board is the shape's own bounding box. */
  box: number
}

/** Difficulty → shape size, piece count and kinds, mirroring. Higher levels repeat the last one. */
export const LEVELS: readonly Level[] = [
  { pieces: 3, sizes: [2, 3], allowMirror: false, box: 4 },
  { pieces: 4, sizes: [3, 4], allowMirror: false, box: 5 },
  { pieces: 5, sizes: [4], allowMirror: false, box: 5 },
  { pieces: 5, sizes: [4, 5], allowMirror: true, box: 6 },
  { pieces: 6, sizes: [4, 5], allowMirror: true, box: 6 },
]

export function levelFor(difficulty: number): Level {
  const i = Math.min(LEVELS.length, Math.max(1, Math.floor(difficulty) || 1)) - 1
  return LEVELS[i] as Level
}

const NEIGHBOURS = [
  { r: -1, c: 0 },
  { r: 1, c: 0 },
  { r: 0, c: -1 },
  { r: 0, c: 1 },
]

/**
 * Free cells next to `from`, each listed once per used neighbour, so a random pick
 * prefers cells that tuck in — the shape stays compact instead of snaking.
 */
function frontier(from: readonly Cell[], used: Set<string>, box: number): Cell[] {
  const out: Cell[] = []
  for (const cell of from) {
    for (const d of NEIGHBOURS) {
      const n = { r: cell.r + d.r, c: cell.c + d.c }
      if (n.r < 0 || n.c < 0 || n.r >= box || n.c >= box || used.has(cellKey(n))) continue
      const weight = 1 + NEIGHBOURS.filter((e) => used.has(cellKey({ r: n.r + e.r, c: n.c + e.c }))).length
      for (let i = 0; i < weight; i++) out.push(n)
    }
  }
  return out
}

/** Grows pieces one by one, each touching the shape so far. `null` when a piece got boxed in. */
function grow(rng: Rng, level: Level): Cell[][] | null {
  const used = new Set<string>()
  const all: Cell[] = []
  const pieces: Cell[][] = []
  const mid = Math.floor(level.box / 2)

  for (let p = 0; p < level.pieces; p++) {
    const want = rng.pick(level.sizes)
    const starts = p === 0 ? [{ r: mid, c: mid }] : frontier(all, used, level.box)
    if (starts.length === 0) return null
    const piece = [rng.pick(starts)]
    used.add(cellKey(piece[0] as Cell))
    while (piece.length < want) {
      const options = frontier(piece, used, level.box)
      if (options.length === 0) return null
      const next = rng.pick(options)
      piece.push(next)
      used.add(cellKey(next))
    }
    pieces.push(piece)
    all.push(...piece)
  }
  return pieces
}

/** The transform that turns `shown` back into `original`'s shape (rotation 0 first). */
function transformTo(shown: readonly Cell[], original: readonly Cell[], allowMirror: boolean) {
  const goal = shapeKey(original)
  for (const mirrored of allowMirror ? [false, true] : [false]) {
    for (let rotation = 0; rotation < 4; rotation++) {
      if (shapeKey(orient(shown, rotation, mirrored)) === goal) return { rotation, mirrored }
    }
  }
  throw new Error('Dílek nejde natočit zpět do původního tvaru')
}

/**
 * Pure: builds the shape by laying pieces next to each other, so a solution always
 * exists. Pieces are then shuffled and shown turned (and flipped, where allowed).
 */
export function generatePolyomino(difficulty: number, seed: number): PolyominoTask {
  const level = levelFor(difficulty)
  const rng = createRng(seed)

  let grown: Cell[][] | null = null
  for (let tries = 0; tries < 100 && !grown; tries++) grown = grow(rng, level)
  if (!grown) throw new Error(`Skládačku pro seed ${seed} se nepodařilo sestavit`)

  // Board = bounding box of the shape
  const all = grown.flat()
  const minR = Math.min(...all.map((x) => x.r))
  const minC = Math.min(...all.map((x) => x.c))
  const placed = grown.map((piece) => piece.map((x) => ({ r: x.r - minR, c: x.c - minC })))
  const target = normalize(all)

  const pieces: Piece[] = []
  const solution: Placement[] = []
  rng.shuffle(placed).forEach((original, id) => {
    const cells = orient(original, rng.int(0, 3), level.allowMirror && rng.int(0, 1) === 1)
    pieces.push({ id, cells })
    solution.push({
      pieceId: id,
      ...transformTo(cells, original, level.allowMirror),
      row: Math.min(...original.map((x) => x.r)),
      col: Math.min(...original.map((x) => x.c)),
    })
  })

  return {
    rows: Math.max(...target.map((x) => x.r)) + 1,
    cols: Math.max(...target.map((x) => x.c)) + 1,
    target,
    pieces,
    allowMirror: level.allowMirror,
    solution,
  }
}

/** Board cells a placed piece covers. */
export function coveredCells(piece: Piece, p: Pick<Placement, 'rotation' | 'mirrored' | 'row' | 'col'>): Cell[] {
  return orient(piece.cells, p.rotation, p.mirrored).map((x) => ({ r: x.r + p.row, c: x.c + p.col }))
}

/**
 * Pure: every piece used once, every cell of the shape covered, nothing sticking out
 * and nothing overlapping. Accepts any such tiling, not only the generator's.
 */
export function validatePolyomino(task: PolyominoTask, answer: PolyominoAnswer): boolean {
  if (!Array.isArray(answer) || answer.length !== task.pieces.length) return false
  const target = new Set(task.target.map(cellKey))
  const covered = new Set<string>()
  const seen = new Set<number>()

  for (const p of answer) {
    const piece = task.pieces.find((x) => x.id === p.pieceId)
    if (!piece || seen.has(p.pieceId)) return false
    seen.add(p.pieceId)
    if (![p.rotation, p.row, p.col].every(Number.isInteger) || p.rotation < 0 || p.rotation > 3) return false
    if (typeof p.mirrored !== 'boolean' || (p.mirrored && !task.allowMirror)) return false

    for (const cell of coveredCells(piece, p)) {
      const key = cellKey(cell)
      if (!target.has(key) || covered.has(key)) return false
      covered.add(key)
    }
  }
  return covered.size === target.size
}
