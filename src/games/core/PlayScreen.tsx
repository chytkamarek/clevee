import type { FormEvent } from 'react'
import type { AnyGame, Difficulty, Locale } from './types.ts'
import { usePlaySession, type PlaySessionDeps } from './usePlaySession.ts'

const strings = {
  cs: { home: 'Domů', check: 'Zkontrolovat', next: 'Další úloha', correct: 'Správně.', wrong: 'Ještě to nesedí.' },
  en: { home: 'Home', check: 'Check', next: 'Next task', correct: 'Correct.', wrong: 'Not quite yet.' },
} satisfies Record<Locale, Record<string, string>>

export interface PlayScreenProps extends PlaySessionDeps {
  game: AnyGame
  difficulty?: Difficulty
  locale?: Locale
}

/** Shared screen for every game: task → check → result → next task. */
export function PlayScreen({ game, difficulty = 1, locale = 'cs', ...deps }: PlayScreenProps) {
  const { state, setAnswer, hint, check, next } = usePlaySession({ game, difficulty, locale }, deps)
  const t = strings[locale]
  const { Renderer } = game

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (state.phase === 'answering') check()
    else next()
  }

  return (
    <main className="play">
      <header className="play__header">
        <a className="play__home" href="#/">
          ← {t.home}
        </a>
        <h1 className="play__title">{game.title[locale]}</h1>
      </header>

      <form className="play__form" onSubmit={onSubmit} noValidate>
        <div className="play__task">
          <Renderer
            key={state.round}
            task={state.task}
            answer={state.answer}
            onAnswer={setAnswer}
            onHint={hint}
            locked={state.phase === 'result'}
            locale={locale}
          />
        </div>

        <p
          className={`play__result${state.phase === 'result' ? (state.correct ? ' play__result--ok' : ' play__result--bad') : ''}`}
          role="status"
        >
          {state.phase === 'result' ? (state.correct ? t.correct : t.wrong) : ''}
        </p>

        {state.phase === 'answering' ? (
          <button key="check" className="play__button" type="submit" disabled={state.answer === null}>
            {t.check}
          </button>
        ) : (
          // Own key → fresh mount, so autoFocus moves focus here and Enter continues
          <button key="next" className="play__button" type="submit" autoFocus>
            {t.next}
          </button>
        )}
      </form>
    </main>
  )
}
