import type { Locale } from './types.ts'

/** What we need to know about a voice; a subset of `SpeechSynthesisVoice`. */
export interface VoiceInfo {
  lang: string
  /** Browsers name voices but do not say whether they are female; we go by name. */
  name?: string
  default?: boolean
  localService?: boolean
}

/** Reading text aloud, independent of the browser API so it can be faked in tests. */
export interface SpeechPort<V extends VoiceInfo = VoiceInfo> {
  getVoices(): V[]
  speak(text: string, voice: V): void
  cancel(): void
  /** Voices often arrive after page load; returns an unsubscribe function. */
  onVoicesChanged(listener: () => void): () => void
}

/** Calm, a little slower than default: the listener is a small child. */
export const SPEECH_RATE = 0.9

/**
 * Soft female voices that sound like a parent reading, best first. Names as Apple, Microsoft
 * and Google ship them; a voice matches when its name contains one of these as a word.
 */
export const GENTLE_VOICES: Record<Locale, readonly string[]> = {
  cs: ['Vlasta', 'Zuzana', 'Iveta'],
  en: [
    'Ava', 'Samantha', 'Allison', 'Susan', 'Serena', 'Jenny', 'Aria', 'Emma', 'Libby', 'Sonia',
    'Google US English', 'Google UK English Female', 'Karen', 'Moira', 'Tessa', 'Catherine', 'Kate', 'Zira',
  ],
}

/** Joke and effect voices (macOS ships many); never read a task with them. */
const NOVELTY = /\b(Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Albert|Deranged|Hysterical|Pipe Organ)\b/i

/** Higher-quality downloadable or neural voices. */
const NATURAL = /\b(Premium|Enhanced|Natural|Neural)\b/i

const hasWord = (name: string, word: string) => new RegExp(`(^|\\W)${word}($|\\W)`, 'i').test(name)

/**
 * Voice for `locale` (`cs-CZ`, `cs_CZ`, `cs` all match `cs`), or `null` when there is none.
 * Prefers a gentle female voice (`GENTLE_VOICES`), then a natural-sounding one, then the
 * browser's default, then an on-device one. Joke voices are never picked.
 */
export function pickVoice<V extends VoiceInfo>(voices: readonly V[], locale: Locale): V | null {
  const gentle = GENTLE_VOICES[locale]
  const score = (v: V) => {
    const name = v.name ?? ''
    const index = gentle.findIndex((word) => hasWord(name, word))
    return [
      index === -1 ? 0 : 1,
      NATURAL.test(name) ? 1 : 0,
      index === -1 ? 0 : gentle.length - index,
      v.default ? 1 : 0,
      v.localService ? 1 : 0,
    ]
  }
  const better = (a: number[], b: number[]) => {
    const i = a.findIndex((x, k) => x !== b[k])
    return i !== -1 && a[i]! > b[i]!
  }
  let best: V | null = null
  let bestScore: number[] = []
  for (const v of voices) {
    if (v.lang.toLowerCase().replace('_', '-').split('-')[0] !== locale) continue
    if (NOVELTY.test(v.name ?? '')) continue
    const s = score(v)
    if (best === null || better(s, bestScore)) [best, bestScore] = [v, s]
  }
  return best
}

interface SpeechWindow {
  speechSynthesis?: SpeechSynthesis
  SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance
}

/** Browser speech, or `null` when the browser cannot speak. Never throws. */
export function browserSpeech(win: SpeechWindow | undefined = globalThis as SpeechWindow): SpeechPort<SpeechSynthesisVoice> | null {
  try {
    const synth = win?.speechSynthesis
    const Utterance = win?.SpeechSynthesisUtterance
    if (!synth || !Utterance) return null
    return {
      getVoices: () => synth.getVoices(),
      speak(text, voice) {
        const utterance = new Utterance(text)
        utterance.voice = voice
        utterance.lang = voice.lang
        utterance.rate = SPEECH_RATE
        synth.cancel()
        synth.speak(utterance)
      },
      cancel: () => synth.cancel(),
      onVoicesChanged(listener) {
        synth.addEventListener?.('voiceschanged', listener)
        return () => synth.removeEventListener?.('voiceschanged', listener)
      },
    }
  } catch {
    return null
  }
}
