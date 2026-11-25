/** Tile picture of the addition demo: two dots and one dot. */
export function AdditionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle className="i-ink" cx="9" cy="18" r="5" />
      <circle className="i-ink" cx="9" cy="31" r="5" />
      <path className="i-stroke i-stroke--bold" d="M18 24 H30 M24 18 V30" />
      <circle className="i-ink" cx="39" cy="24" r="5" />
    </svg>
  )
}
