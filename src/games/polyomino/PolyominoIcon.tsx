/** Tile picture of the shape puzzle: three pieces fitted into a square. */
export function PolyominoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path className="i-piece-1 i-line" d="M6 6 H30 V18 H18 V30 H6Z" />
      <path className="i-piece-2 i-line" d="M30 6 H42 V42 H30Z" />
      <path className="i-piece-3 i-line" d="M18 18 H30 V42 H6 V30 H18Z" />
    </svg>
  )
}
