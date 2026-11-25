import { vi } from 'vitest'
import type { SpeechPort, VoiceInfo } from '../speech.ts'

/** Speech that records calls; `setVoices` simulates voices arriving late. */
export const fakePort = (initial: VoiceInfo[] = [{ lang: 'cs-CZ' }, { lang: 'en-US' }]) => {
  let voices = initial
  const listeners = new Set<() => void>()
  const port = {
    getVoices: () => voices,
    speak: vi.fn<SpeechPort['speak']>(),
    cancel: vi.fn(),
    onVoicesChanged(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  } satisfies SpeechPort
  const setVoices = (next: VoiceInfo[]) => {
    voices = next
    listeners.forEach((l) => l())
  }
  return { port, setVoices, listeners: () => listeners.size }
}
