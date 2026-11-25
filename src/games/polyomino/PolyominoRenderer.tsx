import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import type { Locale, RendererProps } from '../core/types.ts'
import {
  firstFit,
  initialBoard,
  mirrorPiece,
  movePiece,
  placePiece,
  rotatePiece,
  snapToCell,
  toAnswer,
  toTray,
  type BoardState,
  type PieceState,
} from './board.ts'
import type { PolyominoAnswer, PolyominoTask } from './puzzle.ts'
import { polyominoIntro } from './intro.ts'
import { orient, size, type Cell } from './shapes.ts'

const strings = {
  cs: {
    board: 'Tvar k vyplnění',
    tray: 'Dílky',
    piece: (n: number) => `Dílek ${n}`,
    rotate: 'Otočit',
    mirror: 'Překlopit',
    back: 'Vrátit',
  },
  en: {
    board: 'Shape to fill',
    tray: 'Pieces',
    piece: (n: number) => `Piece ${n}`,
    rotate: 'Turn',
    mirror: 'Flip',
    back: 'Take back',
  },
} satisfies Record<Locale, unknown>

/** Movement under this many px is a tap, not a drag — small fingers wobble. */
const TAP_PX = 12

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

interface Drag {
  id: number
  pointerId: number
  startX: number
  startY: number
  /** Grab point inside the piece in board px (tray pieces are smaller), so it does not jump to the finger. */
  offsetX: number
  offsetY: number
  x: number
  y: number
  moved: boolean
}

/**
 * Controls are pictures, not words: the youngest players (2–6) do not read yet.
 * Words stay in aria-label / title for screen readers and parents.
 */
const ICONS = {
  // Arrow curving clockwise
  rotate: (
    <>
      <path d="M19 12a7 7 0 1 1-2.05-4.95" />
      <path d="M19 4v4.5h-4.5" />
    </>
  ),
  // Shape and its mirror image across a dashed line
  mirror: (
    <>
      <path d="M12 3v18" strokeDasharray="2 2.5" />
      <path d="M9 7 3.5 17H9z" />
      <path d="M15 7l5.5 10H15z" />
    </>
  ),
  // Arrow down into the tray below
  back: (
    <>
      <path d="M12 4v11" />
      <path d="m7 10.5 5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
}

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      className="poly__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  )
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
  // Pointer events can outrun re-renders; handlers read the live drag from here
  const dragRef = useRef<Drag | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  // A piece moving between tray and board is a new element; keep keyboard focus on it
  const focusRef = useRef<number | null>(null)

  useEffect(() => {
    if (focusRef.current === null) return
    rootRef.current?.querySelector<HTMLElement>(`[data-piece="${focusRef.current}"]`)?.focus()
    focusRef.current = null
  })

  const startDrag = (next: Drag | null) => {
    dragRef.current = next
    setDrag(next)
  }

  const commit = (next: BoardState) => {
    setBoard(next)
    onAnswer(toAnswer(next))
  }

  const cellsOf = (p: PieceState) => orient(task.pieces.find((x) => x.id === p.id)?.cells ?? [], p.rotation, p.mirrored)
  const colorOf = (id: number) => (id % 6) + 1
  const number = (id: number) => task.pieces.findIndex((x) => x.id === id) + 1

  const onPointerDown = (e: PointerEvent<HTMLElement>, p: PieceState) => {
    if (locked || dragRef.current || !e.isPrimary) return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    const boardRect = boardRef.current?.getBoundingClientRect()
    const boardCell = boardRect ? boardRect.width / task.cols : 0
    const ownCell = rect.width / Math.max(1, size(cellsOf(p)).cols)
    const scale = boardCell > 0 && ownCell > 0 ? boardCell / ownCell : 1
    const id = p.id
    startDrag({
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: (e.clientX - rect.left) * scale,
      offsetY: (e.clientY - rect.top) * scale,
      x: e.clientX,
      y: e.clientY,
      moved: false,
    })
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || e.pointerId !== drag.pointerId) return
    const moved = drag.moved || Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > TAP_PX
    startDrag({ ...drag, x: e.clientX, y: e.clientY, moved })
  }

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || e.pointerId !== drag.pointerId) return
    startDrag(null)
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

  /** Enter/Space: select, and lay a tray piece on the first free spot · arrows: move · R: turn. */
  const onKeyDown = (e: KeyboardEvent<HTMLElement>, id: number) => {
    if (locked) return
    const piece = board.find((p) => p.id === id)
    if (!piece) return
    const arrow = ARROWS[e.key]
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setSelected(id)
      const at = piece.at ? null : firstFit(task, board, id)
      if (at) {
        focusRef.current = id
        commit(placePiece(task, board, id, at.row, at.col))
      }
    } else if (arrow && piece.at) {
      e.preventDefault()
      setSelected(id)
      commit(movePiece(task, board, id, arrow[0], arrow[1]))
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault()
      setSelected(id)
      focusRef.current = id
      commit(rotatePiece(task, board, id))
    }
  }

  const pieceProps = (p: PieceState) => ({
    role: 'button',
    tabIndex: locked ? -1 : 0,
    'aria-label': t.piece(number(p.id)),
    'aria-pressed': selected === p.id,
    'aria-disabled': locked || undefined,
    'aria-keyshortcuts': 'Enter ArrowUp ArrowDown ArrowLeft ArrowRight R',
    'data-piece': p.id,
    className: `poly__piece${selected === p.id ? ' poly__piece--selected' : ''}${drag?.id === p.id && drag.moved ? ' poly__piece--lifted' : ''}`,
    onPointerDown: (e: PointerEvent<HTMLElement>) => onPointerDown(e, p),
    onPointerMove,
    onPointerUp,
    onPointerCancel: () => startDrag(null),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => onKeyDown(e, p.id),
  })

  const selectedPiece = board.find((p) => p.id === selected) ?? null
  const dragged = drag?.moved ? board.find((p) => p.id === drag.id) : undefined

  return (
    <div ref={rootRef} className={`poly${locked ? ' poly--locked' : ''}`}>
      <p className="poly__intro">{polyominoIntro[locale]}</p>

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
          aria-label={t.rotate}
          title={t.rotate}
        >
          <Icon name="rotate" />
        </button>
        {task.allowMirror && (
          <button
            type="button"
            className="poly__control"
            disabled={locked || !selectedPiece}
            onClick={() => selectedPiece && commit(mirrorPiece(task, board, selectedPiece.id))}
            aria-label={t.mirror}
            title={t.mirror}
          >
            <Icon name="mirror" />
          </button>
        )}
        <button
          type="button"
          className="poly__control"
          disabled={locked || !selectedPiece?.at}
          onClick={() => selectedPiece && commit(toTray(board, selectedPiece.id))}
          aria-label={t.back}
          title={t.back}
        >
          <Icon name="back" />
        </button>
      </div>

      <div className="poly__tray" role="group" aria-label={t.tray}>
        {/* Each piece has a fixed square spot, so the tray does not shift when pieces turn or leave */}
        {board.map((p) => {
          const box = size(task.pieces.find((x) => x.id === p.id)?.cells ?? [])
          const side = `calc(${Math.max(box.rows, box.cols)} * var(--cell))`
          return (
            <span key={p.id} className="poly__spot" style={{ width: side, height: side }}>
              {!p.at && (
                <span {...pieceProps(p)}>
                  <PieceShape cells={cellsOf(p)} color={colorOf(p.id)} />
                </span>
              )}
            </span>
          )
        })}
      </div>

      {dragged && drag && (
        <span className="poly__ghost" aria-hidden="true" style={{ left: drag.x - drag.offsetX, top: drag.y - drag.offsetY }}>
          <PieceShape cells={cellsOf(dragged)} color={colorOf(dragged.id)} />
        </span>
      )}
    </div>
  )
}
