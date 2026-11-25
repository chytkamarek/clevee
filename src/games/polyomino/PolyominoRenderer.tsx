import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import type { Locale, RendererProps } from '../core/types.ts'
import {
  initialBoard,
  mirrorPiece,
  placePiece,
  rotatePiece,
  snapToCell,
  toAnswer,
  toTray,
  type BoardState,
  type PieceState,
} from './board.ts'
import type { PolyominoAnswer, PolyominoTask } from './puzzle.ts'
import { orient, size, type Cell } from './shapes.ts'

const strings = {
  cs: {
    intro: 'Přetáhni dílky do tvaru. Ťuknutím dílek otočíš.',
    board: 'Tvar k vyplnění',
    tray: 'Dílky',
    piece: (n: number) => `Dílek ${n}`,
    rotate: 'Otočit',
    mirror: 'Překlopit',
    back: 'Vrátit',
  },
  en: {
    intro: 'Drag the pieces into the shape. Tap a piece to turn it.',
    board: 'Shape to fill',
    tray: 'Pieces',
    piece: (n: number) => `Piece ${n}`,
    rotate: 'Turn',
    mirror: 'Flip',
    back: 'Take back',
  },
} satisfies Record<Locale, unknown>

/** Movement under this many px is a tap, not a drag. */
const TAP_PX = 8

interface Drag {
  id: number
  pointerId: number
  startX: number
  startY: number
  /** Pointer position inside the piece, so it does not jump to the finger. */
  offsetX: number
  offsetY: number
  x: number
  y: number
  moved: boolean
}

const cellStyle = (cell: Cell): CSSProperties => ({
  left: `calc(${cell.c} * var(--cell))`,
  top: `calc(${cell.r} * var(--cell))`,
})

function PieceShape({ cells, color }: { cells: Cell[]; color: number }) {
  const box = size(cells)
  return (
    <span
      className="poly__shape"
      style={{ width: `calc(${box.cols} * var(--cell))`, height: `calc(${box.rows} * var(--cell))` }}
    >
      {cells.map((cell) => (
        <span key={`${cell.r},${cell.c}`} className={`poly__cell poly__cell--${color}`} style={cellStyle(cell)} />
      ))}
    </span>
  )
}

export function PolyominoRenderer({ task, onAnswer, locked, locale }: RendererProps<PolyominoTask, PolyominoAnswer>) {
  const t = strings[locale]
  const [board, setBoard] = useState<BoardState>(() => initialBoard(task))
  const [selected, setSelected] = useState<number | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  const commit = (next: BoardState) => {
    setBoard(next)
    onAnswer(toAnswer(next))
  }

  const cellsOf = (p: PieceState) => orient(task.pieces.find((x) => x.id === p.id)?.cells ?? [], p.rotation, p.mirrored)
  const colorOf = (id: number) => (id % 6) + 1
  const number = (id: number) => task.pieces.findIndex((x) => x.id === id) + 1

  const onPointerDown = (e: PointerEvent<HTMLElement>, id: number) => {
    if (locked || drag || !e.isPrimary) return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    setDrag({
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      x: e.clientX,
      y: e.clientY,
      moved: false,
    })
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return
    const moved = drag.moved || Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > TAP_PX
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved })
  }

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return
    setDrag(null)
    setSelected(drag.id)
    if (!drag.moved) {
      commit(rotatePiece(task, board, drag.id))
      return
    }
    const el = boardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cellPx = rect.width / task.cols
    const at = snapToCell(drag.x - drag.offsetX, drag.y - drag.offsetY, rect, cellPx)
    commit(placePiece(task, board, drag.id, at.row, at.col))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLElement>, id: number) => {
    if (locked || (e.key !== 'Enter' && e.key !== ' ')) return
    e.preventDefault()
    setSelected(id)
  }

  const pieceProps = (p: PieceState) => ({
    role: 'button',
    tabIndex: locked ? -1 : 0,
    'aria-label': t.piece(number(p.id)),
    'aria-pressed': selected === p.id,
    'aria-disabled': locked || undefined,
    className: `poly__piece${selected === p.id ? ' poly__piece--selected' : ''}${drag?.id === p.id && drag.moved ? ' poly__piece--lifted' : ''}`,
    onPointerDown: (e: PointerEvent<HTMLElement>) => onPointerDown(e, p.id),
    onPointerMove,
    onPointerUp,
    onPointerCancel: () => setDrag(null),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => onKeyDown(e, p.id),
  })

  const selectedPiece = board.find((p) => p.id === selected) ?? null
  const dragged = drag?.moved ? board.find((p) => p.id === drag.id) : undefined

  return (
    <div className={`poly${locked ? ' poly--locked' : ''}`}>
      <p className="poly__intro">{t.intro}</p>

      <div
        ref={boardRef}
        className="poly__board"
        role="group"
        aria-label={t.board}
        style={{ width: `calc(${task.cols} * var(--cell))`, height: `calc(${task.rows} * var(--cell))` }}
      >
        {task.target.map((cell) => (
          <span key={`${cell.r},${cell.c}`} className="poly__slot" style={cellStyle(cell)} />
        ))}
        {board.map((p) =>
          p.at ? (
            <span key={p.id} {...pieceProps(p)} style={cellStyle({ r: p.at.row, c: p.at.col })}>
              <PieceShape cells={cellsOf(p)} color={colorOf(p.id)} />
            </span>
          ) : null,
        )}
      </div>

      <div className="poly__controls">
        <button
          type="button"
          className="poly__control"
          disabled={locked || !selectedPiece}
          onClick={() => selectedPiece && commit(rotatePiece(task, board, selectedPiece.id))}
        >
          ↻ {t.rotate}
        </button>
        {task.allowMirror && (
          <button
            type="button"
            className="poly__control"
            disabled={locked || !selectedPiece}
            onClick={() => selectedPiece && commit(mirrorPiece(task, board, selectedPiece.id))}
          >
            ⇋ {t.mirror}
          </button>
        )}
        <button
          type="button"
          className="poly__control"
          disabled={locked || !selectedPiece?.at}
          onClick={() => selectedPiece && commit(toTray(board, selectedPiece.id))}
        >
          {t.back}
        </button>
      </div>

      <div className="poly__tray" role="group" aria-label={t.tray}>
        {board.map((p) =>
          p.at ? null : (
            <span key={p.id} {...pieceProps(p)}>
              <PieceShape cells={cellsOf(p)} color={colorOf(p.id)} />
            </span>
          ),
        )}
      </div>

      {dragged && drag && (
        <span className="poly__ghost" aria-hidden="true" style={{ left: drag.x - drag.offsetX, top: drag.y - drag.offsetY }}>
          <PieceShape cells={cellsOf(dragged)} color={colorOf(dragged.id)} />
        </span>
      )}
    </div>
  )
}
