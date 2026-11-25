import { useState } from 'react'
import { browserStorage, saveAttempt, type AttemptStorage } from './attempts.ts'
import { randomSeed } from './rng.ts'
import { sessionReducer, startSession, type SessionAction, type SessionConfig } from './session.ts'

export interface PlaySessionDeps {
  now?: () => number
  nextSeed?: () => number
  storage?: AttemptStorage | null
}

/** React binding of the session state machine; saves each checked answer to history. */
export function usePlaySession(config: SessionConfig, deps: PlaySessionDeps = {}) {
  const now = deps.now ?? Date.now
  const nextSeed = deps.nextSeed ?? randomSeed
  const storage = deps.storage === undefined ? browserStorage() : deps.storage

  const [state, setState] = useState(() => startSession(config, nextSeed(), now()))

  // Side effect (saving) happens here, once per user action — not inside the reducer or an effect.
  const dispatch = (action: SessionAction) => {
    const next = sessionReducer(config, state, action)
    if (next === state) return
    setState(next)
    if (state.phase === 'answering' && next.phase === 'result' && storage) {
      saveAttempt(storage, next.attempt)
    }
  }

  return {
    state,
    setAnswer: (answer: unknown) => dispatch({ type: 'answer', answer }),
    hint: () => dispatch({ type: 'hint' }),
    check: () => dispatch({ type: 'check', now: now() }),
    next: () => dispatch({ type: 'next', seed: nextSeed(), now: now() }),
  }
}
