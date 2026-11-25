import { coveredCells, type Placement, type PolyominoAnswer, type PolyominoTask } from './puzzle.ts'
import { cellKey } from './shapes.ts'

/** What the child has done with one piece: how it is turned and where it lies (`null` = in the tray). */
export interface PieceState {
  id: number
  rotation: number
  mirrored: boolean
  at: { row: number; col: number } | null
}

export type BoardState = PieceState[]

export const initialBoard = (task: PolyominoTask): BoardState =>
  task.pieces.map((p) => ({ id: p.id, rotation: 0, mirrored: false, at: null }))

/**
 * Can the piece lie at (row, col) in the given orientation? Only onto free cells of the
 * shape — a drop that would stick out or overlap is refused and the piece stays in the tray.
 */
export function canPlace(
  task: PolyominoTask,
  board: BoardState,
  pieceId: number,
  where: Pick<Placement, 'rotation' | 'mirrored' | 'row' | 'col'>,
): boolean {
  const piece = task.pieces.find((p) => p.id === pieceId)
  if (!piece) return false
  const target = new Set(task.target.map(cellKey))
  const taken = new Set<string>()
  for (const other of board) {
    if (other.id === pieceId || !other.at) continue
    const otherPiece = task.pieces.find((p) => p.id === other.id)
    if (otherPiece) for (const c of coveredCells(otherPiece, { ...other, ...other.at })) taken.add(cellKey(c))
  }
  return coveredCells(piece, where).every((c) => target.has(cellKey(c)) && !taken.has(cellKey(c)))
}

const update = (board: BoardState, id: number, change: Partial<PieceState>) =>
  board.map((p) => (p.id === id ? { ...p, ...change } : p))

/** Lays the piece at (row, col) if it fits; otherwise it goes (back) to the tray. */
export function placePiece(task: PolyominoTask, board: BoardState, id: number, row: number, col: number): BoardState {
  const piece = board.find((p) => p.id === id)
  if (!piece) return board
  return update(board, id, { at: canPlace(task, board, id, { ...piece, row, col }) ? { row, col } : null })
}

/** First position (row by row) where the piece fits as it is turned now — for placing from the keyboard. */
export function firstFit(task: PolyominoTask, board: BoardState, id: number): { row: number; col: number } | null {
  const piece = board.find((p) => p.id === id)
  if (!piece) return null
  for (let row = 0; row < task.rows; row++) {
    for (let col = 0; col < task.cols; col++) {
      if (canPlace(task, board, id, { ...piece, row, col })) return { row, col }
    }
  }
  return null
}

/** Shifts a placed piece by one step; a move that does not fit is ignored (the piece stays). */
export function movePiece(task: PolyominoTask, board: BoardState, id: number, dRow: number, dCol: number): BoardState {
  const piece = board.find((p) => p.id === id)
  if (!piece?.at) return board
  const at = { row: piece.at.row + dRow, col: piece.at.col + dCol }
  return canPlace(task, board, id, { ...piece, ...at }) ? update(board, id, { at }) : board
}

export const toTray = (board: BoardState, id: number) => update(board, id, { at: null })

/** New orientation; a piece on the board keeps its top-left corner, or goes to the tray when it no longer fits. */
function reorient(task: PolyominoTask, board: BoardState, id: number, rotation: number, mirrored: boolean) {
  const piece = board.find((p) => p.id === id)
  if (!piece) return board
  const fits = piece.at !== null && canPlace(task, board, id, { rotation, mirrored, ...piece.at })
  return update(board, id, { rotation, mirrored, at: fits ? piece.at : null })
}

export function rotatePiece(task: PolyominoTask, board: BoardState, id: number): BoardState {
  const piece = board.find((p) => p.id === id)
  return piece ? reorient(task, board, id, (piece.rotation + 1) % 4, piece.mirrored) : board
}

export function mirrorPiece(task: PolyominoTask, board: BoardState, id: number): BoardState {
  const piece = board.find((p) => p.id === id)
  if (!piece || !task.allowMirror) return board
  return reorient(task, board, id, piece.rotation, !piece.mirrored)
}

/** The answer once every piece lies on the board, else `null` (nothing to check yet). */
export function toAnswer(board: BoardState): PolyominoAnswer | null {
  if (board.some((p) => p.at === null)) return null
  return board.map((p) => ({ pieceId: p.id, rotation: p.rotation, mirrored: p.mirrored, row: p.at!.row, col: p.at!.col }))
}

/**
 * Board cell a dragged piece snaps to: the cell nearest to the piece's top-left corner
 * at (left, top) px, given the board's box and the cell size in px.
 */
export function snapToCell(left: number, top: number, rect: { left: number; top: number }, cellPx: number) {
  return { row: Math.round((top - rect.top) / cellPx), col: Math.round((left - rect.left) / cellPx) }
}
