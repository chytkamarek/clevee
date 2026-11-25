import { useState } from 'react'
import { browserStorage, loadAttempts, type AttemptStorage } from '../games/core/attempts.ts'
import type { AnyGame, Locale } from '../games/core/types.ts'
import { stageFor } from '../klicek/growth.ts'
import { KlicekArt } from '../klicek/KlicekArt.tsx'
import { syncGrowth } from '../klicek/progress.ts'
import { playHref } from '../route.ts'
import { BackIcon, PlayIcon } from './icons.tsx'
import { pathFor, type Stone } from './path.ts'

const strings = {
  cs: {
    home: 'Domů',
    play: 'Hrát',
    path: 'Pěšinka',
    passed: (n: number) => `Kamínek ${n}, prošlý, hrát znovu`,
    current: (n: number) => `Kamínek ${n}, tady stojí Klíček, hrát`,
    ahead: (n: number) => `Kamínek ${n}, ještě před tebou`,
  },
  en: {
    home: 'Home',
    play: 'Play',
    path: 'Path',
    passed: (n: number) => `Stone ${n}, passed, play again`,
    current: (n: number) => `Stone ${n}, Klíček stands here, play`,
    ahead: (n: number) => `Stone ${n}, still ahead`,
  },
}

export interface GamePathProps {
  game: AnyGame
  locale?: Locale
  storage?: AttemptStorage | null
}

/** A game's row of stones: where the child has been, where Klíček stands, the ▶ button. */
export function GamePath({ game, locale = 'cs', storage }: GamePathProps) {
  const [{ stones, growth }] = useState(() => {
    const s = storage === undefined ? browserStorage() : storage
    return { stones: pathFor(game.id, game.levels, s ? loadAttempts(s) : []), growth: syncGrowth(s) }
  })
  const t = strings[locale]
  const current = stones.find((s) => s.current) ?? stones[0]
  const GameIcon = game.icon

  const stoneClass = (s: Stone) =>
    `stone${s.passed ? ' stone--passed' : ' stone--ahead'}${s.current ? ' stone--current' : ''}`

  return (
    <main className={`path path--${game.module}`}>
      <header className="path__header">
        <a className="icon-button" href="#/" aria-label={t.home}>
          <BackIcon className="icon-button__icon" />
        </a>
        <GameIcon className="path__game-icon" />
        <h1 className="path__title">{game.title[locale]}</h1>
      </header>

      <ol className="path__stones" aria-label={t.path}>
        {stones.map((s) => (
          <li key={s.level} className="path__spot">
            {s.current && <KlicekArt stage={stageFor(growth.solved)} className="path__klicek" />}
            {s.passed || s.current ? (
              <a
                className={stoneClass(s)}
                href={playHref(game.id, s.level)}
                aria-label={s.current ? t.current(s.level) : t.passed(s.level)}
                aria-current={s.current ? 'step' : undefined}
              />
            ) : (
              <span className={stoneClass(s)} role="img" aria-label={t.ahead(s.level)} />
            )}
          </li>
        ))}
      </ol>

      {current && (
        <a className="play__button path__play" href={playHref(game.id, current.level)} aria-label={t.play}>
          <PlayIcon className="path__play-icon" />
        </a>
      )}
    </main>
  )
}
