import type { ComponentType } from 'react'

export type Locale = 'cs' | 'en'

/** Place in the child's world where a game lives on the home page. */
export type GameModule = 'math' | 'language' | 'space'

/** Picture of a game on its home tile; draws in the tile's colours, decorative only. */
export type GameIcon = ComponentType<{ className?: string }>

/** Difficulty level, integer from 1 (easiest) upward. Each game decides how far it goes. */
export type Difficulty = number

export interface RendererProps<Task, Answer> {
  task: Task
  /** Current answer, `null` until the child gives one. */
  answer: Answer | null
  onAnswer(answer: Answer | null): void
  /** Call when the child opens a hint; the play screen counts them. */
  onHint(): void
  /** True once the answer was checked — the renderer must not accept changes. */
  locked: boolean
  locale: Locale
}

/**
 * Contract every game implements. A new game = generator + validator + renderer;
 * the play screen, attempt history and registry are shared.
 */
export interface Game<Task, Answer> {
  /** Stable id, used in URLs and stored attempts. Never rename once released. */
  id: string
  title: Record<Locale, string>
  /** Place on the home page. */
  module: GameModule
  /** Picture on the game's tile. */
  icon: GameIcon
  /** How many levels (stones on the game's path) it supports, from difficulty 1 upward. */
  levels: number
  /** Pure: same (difficulty, seed, locale) → same task. Use `createRng(seed)` for randomness. */
  generate(difficulty: Difficulty, seed: number, locale: Locale): Task
  /** Pure: is `answer` a correct solution of `task`? */
  validate(task: Task, answer: Answer): boolean
  Renderer: ComponentType<RendererProps<Task, Answer>>
}

/**
 * Game with its own Task/Answer types erased, so different games fit one registry.
 * Safe because the play screen only passes a game's own tasks and answers back to it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGame = Game<any, any>
