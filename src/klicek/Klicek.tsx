import { useEffect, useState } from 'react'
import type { Locale } from '../games/core/types.ts'
import { mascotLabel, type Stage } from './growth.ts'
import { KlicekArt } from './KlicekArt.tsx'

const sameStage = (a: Stage, b: Stage) => a.phase === b.phase && a.extras === b.extras

export interface KlicekProps {
  /** What the child saw last time. */
  from: Stage
  /** How grown Klíček is now. */
  to: Stage
  locale?: Locale
}

/**
 * Klíček, the mascot. When it has grown since the child last saw it, the old drawing
 * slowly fades into the new one — once, no celebration. Reduced motion: instant (CSS).
 */
export function Klicek({ from, to, locale = 'cs' }: KlicekProps) {
  const changed = !sameStage(from, to)
  const [grown, setGrown] = useState(!changed)

  useEffect(() => {
    if (grown) return
    // Two frames, so the browser paints the old drawing before the fade starts
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setGrown(true))
    })
    return () => cancelAnimationFrame(id)
  }, [grown])

  const layer = (visible: boolean, after = false) =>
    `klicek__layer${visible ? '' : ' klicek__layer--hidden'}${after ? ' klicek__layer--after' : ''}`

  // Fade-through: the old drawing fades out first, then the new one fades in,
  // so two faces never show at once (e.g. the face moving from the drop into the trunk)
  return (
    <div className="klicek" role="img" aria-label={mascotLabel(to.phase, locale)}>
      {changed && <KlicekArt stage={from} className={layer(!grown)} />}
      <KlicekArt stage={to} className={layer(grown, changed)} />
    </div>
  )
}
