import { useEffect, useState } from 'react'
import { browserSpeech, pickVoice, type SpeechPort, type VoiceInfo } from './speech.ts'
import type { Locale } from './types.ts'

const defaultPort = browserSpeech()

/**
 * Reads text aloud in `locale`. `speak` is `null` when there is no voice for it.
 * A new `resetKey` (next task) or leaving the screen stops reading that is under way.
 */
export function useSpeech(locale: Locale, resetKey: unknown, port: SpeechPort | null = defaultPort) {
  const [voice, setVoice] = useState<VoiceInfo | null>(() => (port ? pickVoice(port.getVoices(), locale) : null))

  useEffect(() => {
    if (!port) return
    const update = () => setVoice(pickVoice(port.getVoices(), locale))
    update()
    return port.onVoicesChanged(update)
  }, [port, locale])

  useEffect(() => {
    if (!port) return
    return () => port.cancel()
  }, [port, resetKey])

  return { speak: port && voice ? (text: string) => port.speak(text, voice) : null }
}
