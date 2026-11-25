// Small decorative pictures for the home page and the path. Colours come from `.i-*`
// classes in index.css, which take them from :root tokens. Always aria-hidden: the
// link or region around them carries the words.

const svg = (className: string | undefined) => ({
  className,
  viewBox: '0 0 48 48',
  'aria-hidden': true,
  focusable: false,
})

/** Mathematics: counting beads on a rod. */
export function MathIcon({ className }: { className?: string }) {
  return (
    <svg {...svg(className)}>
      <rect className="i-ink" x="4" y="22.5" width="40" height="3" rx="1.5" />
      <circle className="i-paper i-line" cx="13" cy="24" r="7" />
      <circle className="i-paper i-line" cx="24" cy="24" r="7" />
      <circle className="i-ink" cx="35" cy="24" r="7" />
    </svg>
  )
}

/** Language: an open book. */
export function LanguageIcon({ className }: { className?: string }) {
  return (
    <svg {...svg(className)}>
      <path className="i-paper i-line" d="M24 13 C18 9 10 9 5 11 V37 C10 35 18 35 24 39Z" />
      <path className="i-paper i-line" d="M24 13 C30 9 38 9 43 11 V37 C38 35 30 35 24 39Z" />
      <path className="i-stroke" d="M10 18 H19 M10 23 H19 M29 18 H38 M29 23 H38 M29 28 H35" />
    </svg>
  )
}

/** Space: three shapes side by side. */
export function SpaceIcon({ className }: { className?: string }) {
  return (
    <svg {...svg(className)}>
      <rect className="i-paper i-line" x="4" y="26" width="15" height="15" rx="2" />
      <circle className="i-ink" cx="35" cy="33.5" r="7.5" />
      <path className="i-paper i-line" d="M24 7 L33 22 H15Z" />
    </svg>
  )
}


/** Klíček asleep: a place with no games yet, quiet and fine. */
export function SleepingKlicek({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-34 -36 68 68" aria-hidden="true" focusable="false">
      <path
        className="k-body"
        d="M0 -30 C22 -16 30 2 30 10 C30 24 16 30 0 30 C-16 30 -30 24 -30 10 C-30 2 -22 -16 0 -30Z"
      />
      <path className="i-stroke" d="M-14 6 Q-9 10 -4 6 M4 6 Q9 10 14 6" />
      <ellipse className="k-cheek" cx="-15" cy="15" rx="3.5" ry="2" />
      <ellipse className="k-cheek" cx="15" cy="15" rx="3.5" ry="2" />
      <path className="i-stroke" d="M-3 18 Q0 20 3 18" />
    </svg>
  )
}

/** ▶ on the main button. */
export function PlayIcon({ className }: { className?: string }) {
  return (
    <svg {...svg(className)}>
      <path className="i-ink" d="M16 10 L38 24 L16 38Z" />
    </svg>
  )
}

/** Read aloud: a speaker with two sound waves. */
export function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg {...svg(className)}>
      <path className="i-ink" d="M8 19 H15 L25 10 V38 L15 29 H8 Z" />
      <path className="i-stroke i-stroke--bold" d="M31 18 C34 21 34 27 31 30 M36 13 C42 19 42 29 36 35" />
    </svg>
  )
}

/** ← back. */
export function BackIcon({ className }: { className?: string }) {
  return (
    <svg {...svg(className)}>
      <path className="i-stroke i-stroke--bold" d="M28 12 L16 24 L28 36" />
    </svg>
  )
}
