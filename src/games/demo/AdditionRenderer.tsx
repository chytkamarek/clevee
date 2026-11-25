import { useState } from 'react'
import type { RendererProps } from '../core/types.ts'
import type { AdditionTask } from './additionGame.ts'

const strings = {
  cs: { label: 'Výsledek', hint: 'Nápověda', hintText: (a: number) => `Začni od ${a} a přičítej po jedné.` },
  en: { label: 'Result', hint: 'Hint', hintText: (a: number) => `Start at ${a} and count up one by one.` },
}

export function AdditionRenderer({ task, answer, onAnswer, onHint, locked, locale }: RendererProps<AdditionTask, number>) {
  const [showHint, setShowHint] = useState(false)
  const t = strings[locale]

  return (
    <div className="demo">
      <label className="demo__equation">
        <span>
          {task.a} + {task.b} =
        </span>
        <input
          className="demo__input"
          type="number"
          inputMode="numeric"
          aria-label={t.label}
          value={answer ?? ''}
          readOnly={locked}
          autoFocus
          onChange={(e) => onAnswer(e.target.value === '' ? null : Number(e.target.value))}
        />
      </label>
      {showHint ? (
        <p className="demo__hint">{t.hintText(task.a)}</p>
      ) : (
        <button
          className="demo__hint-button"
          type="button"
          disabled={locked}
          onClick={() => {
            setShowHint(true)
            onHint()
          }}
        >
          {t.hint}
        </button>
      )}
    </div>
  )
}
