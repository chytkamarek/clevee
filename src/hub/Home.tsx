import type { AnyGame, GameIcon, GameModule, Locale } from '../games/core/types.ts'
import { pathHref } from '../route.ts'
import { LanguageIcon, MathIcon, SleepingKlicek, SpaceIcon } from './icons.tsx'
import { groupByModule } from './modules.ts'

const placeNames: Record<Locale, Record<GameModule, string>> = {
  cs: { math: 'Matematika', language: 'Jazyk', space: 'Prostor' },
  en: { math: 'Maths', language: 'Language', space: 'Space' },
}

const moduleIcons: Record<GameModule, GameIcon> = { math: MathIcon, language: LanguageIcon, space: SpaceIcon }

const strings = {
  cs: { empty: 'Klíček tu spí, hry sem teprve přijdou' },
  en: { empty: 'Klíček is asleep here, games are on their way' },
} satisfies Record<Locale, Record<string, string>>

/** The three places with their games as big tiles; words only for screen readers and parents. */
export function Places({ games, locale = 'cs' }: { games: readonly AnyGame[]; locale?: Locale }) {
  return (
    <div className="places">
      {groupByModule(games).map(({ module, games: inPlace }) => {
        const name = placeNames[locale][module]
        const Icon = moduleIcons[module]
        return (
          <section key={module} className={`place place--${module}`} aria-label={name}>
            <header className="place__header">
              <Icon className="place__icon" />
              <span className="place__caption">{name}</span>
            </header>
            {inPlace.length === 0 ? (
              <div className="place__empty" role="img" aria-label={strings[locale].empty}>
                <SleepingKlicek className="place__sleeper" />
              </div>
            ) : (
              <ul className="place__tiles">
                {inPlace.map((game) => {
                  const GameIcon = game.icon
                  return (
                    <li key={game.id}>
                      <a className="tile" href={pathHref(game.id)} aria-label={game.title[locale]}>
                        <GameIcon className="tile__icon" />
                        <span className="tile__caption">{game.title[locale]}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
