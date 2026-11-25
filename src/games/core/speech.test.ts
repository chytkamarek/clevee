import { describe, expect, it, vi } from 'vitest'
import { browserSpeech, pickVoice, SPEECH_RATE } from './speech.ts'

const cs = { lang: 'cs-CZ', name: 'Zuzana' }
const en = { lang: 'en-US', name: 'Samantha' }
const de = { lang: 'de-DE', name: 'Anna' }

describe('pickVoice', () => {
  it('picks a Czech voice for cs and an English one for en', () => {
    expect(pickVoice([en, cs, de], 'cs')).toBe(cs)
    expect(pickVoice([cs, de, en], 'en')).toBe(en)
  })

  it('returns null when no voice speaks the language', () => {
    expect(pickVoice([de, en], 'cs')).toBeNull()
    expect(pickVoice([], 'en')).toBeNull()
  })

  it('matches language tags regardless of region, case and separator', () => {
    const underscore = { lang: 'cs_CZ' }
    const bare = { lang: 'EN' }
    expect(pickVoice([underscore], 'cs')).toBe(underscore)
    expect(pickVoice([bare], 'en')).toBe(bare)
    expect(pickVoice([{ lang: 'csb-PL' }], 'cs')).toBeNull()
  })

  it('prefers the default voice, then an on-device one', () => {
    const remote = { lang: 'en-GB' }
    const local = { lang: 'en-US', localService: true }
    const preferred = { lang: 'en-AU', default: true }
    expect(pickVoice([remote, local], 'en')).toBe(local)
    expect(pickVoice([remote, local, preferred], 'en')).toBe(preferred)
  })
})

class FakeUtterance {
  voice: unknown = null
  lang = ''
  rate = 1
  constructor(public text: string) {}
}

const fakeWindow = () => {
  const synth = {
    getVoices: vi.fn(() => [cs, en]),
    speak: vi.fn(),
    cancel: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  return { synth, win: { speechSynthesis: synth, SpeechSynthesisUtterance: FakeUtterance } as never }
}

describe('browserSpeech', () => {
  it('is unavailable without speechSynthesis, without throwing', () => {
    expect(browserSpeech({})).toBeNull()
    expect(browserSpeech(undefined)).toBeNull()
    expect(browserSpeech({ speechSynthesis: {} as SpeechSynthesis })).toBeNull()
  })

  it('is unavailable when touching speechSynthesis throws', () => {
    const win = {
      get speechSynthesis(): SpeechSynthesis {
        throw new Error('blocked')
      },
    }
    expect(browserSpeech(win)).toBeNull()
  })

  it('speaks with the chosen voice, calmly, after stopping earlier reading', () => {
    const { synth, win } = fakeWindow()
    const port = browserSpeech(win)!
    port.speak('Ahoj', cs as never)

    expect(synth.cancel).toHaveBeenCalled()
    const utterance = synth.speak.mock.calls[0]?.[0] as FakeUtterance
    expect(utterance).toMatchObject({ text: 'Ahoj', voice: cs, lang: 'cs-CZ', rate: SPEECH_RATE })
    expect(synth.cancel.mock.invocationCallOrder[0]).toBeLessThan(synth.speak.mock.invocationCallOrder[0]!)
  })

  it('subscribes to voiceschanged and unsubscribes the same listener', () => {
    const { synth, win } = fakeWindow()
    const listener = () => {}
    const off = browserSpeech(win)!.onVoicesChanged(listener)
    expect(synth.addEventListener).toHaveBeenCalledWith('voiceschanged', listener)
    off()
    expect(synth.removeEventListener).toHaveBeenCalledWith('voiceschanged', listener)
  })
})
