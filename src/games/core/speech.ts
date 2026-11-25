import type { Locale } from './types.ts'

/** What we need to know about a voice; a subset of `SpeechSynthesisVoice`. */
export interface VoiceInfo {
  lang: string
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
 * Voice for `locale` (`cs-CZ`, `cs_CZ`, `cs` all match `cs`), or `null` when there is none.
 * Among matches, the browser's default voice wins, then an on-device one.
 */
export function pickVoice<V extends VoiceInfo>(voices: readonly V[], locale: Locale): V | null {
  const matches = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').split('-')[0] === locale)
  const rank = (v: V) => (v.default ? 2 : 0) + (v.localService ? 1 : 0)
  return matches.reduce<V | null>((best, v) => (best === null || rank(v) > rank(best) ? v : best), null)
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
