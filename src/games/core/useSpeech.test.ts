import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { SpeechPort } from './speech.ts'
import { fakePort } from './testing/fakeSpeech.ts'
import type { Locale } from './types.ts'
import { useSpeech } from './useSpeech.ts'

const hook = (port: SpeechPort | null, locale: Locale = 'cs', resetKey = 0) =>
  renderHook((p: { locale: Locale; resetKey: number }) => useSpeech(p.locale, p.resetKey, port), {
    initialProps: { locale, resetKey },
  })

describe('useSpeech', () => {
  it('speaks in the voice for the locale', () => {
    const { port } = fakePort()
    const { result, rerender } = hook(port)
    result.current.speak?.('Ahoj')
    expect(port.speak).toHaveBeenLastCalledWith('Ahoj', { lang: 'cs-CZ' })

    rerender({ locale: 'en', resetKey: 0 })
    result.current.speak?.('Hello')
    expect(port.speak).toHaveBeenLastCalledWith('Hello', { lang: 'en-US' })
  })

  it('cannot speak without speech support or without a voice for the locale', () => {
    expect(hook(null).result.current.speak).toBeNull()
    expect(hook(fakePort([{ lang: 'en-US' }]).port, 'cs').result.current.speak).toBeNull()
  })

  it('becomes able to speak once voices load late', () => {
    const { port, setVoices } = fakePort([])
    const { result } = hook(port)
    expect(result.current.speak).toBeNull()
    act(() => setVoices([{ lang: 'cs-CZ' }]))
    expect(result.current.speak).not.toBeNull()
  })

  it('stops listening for voices when the screen goes away', () => {
    const { port, listeners } = fakePort()
    const { unmount } = hook(port)
    expect(listeners()).toBe(1)
    unmount()
    expect(listeners()).toBe(0)
  })

  it('stops reading when the task changes', () => {
    const { port } = fakePort()
    const { rerender } = hook(port)
    expect(port.cancel).not.toHaveBeenCalled()
    rerender({ locale: 'cs', resetKey: 0 })
    expect(port.cancel).not.toHaveBeenCalled()
    rerender({ locale: 'cs', resetKey: 1 })
    expect(port.cancel).toHaveBeenCalledTimes(1)
  })

  it('stops reading when the screen goes away', () => {
    const { port } = fakePort()
    const { unmount } = hook(port)
    unmount()
    expect(port.cancel).toHaveBeenCalledTimes(1)
  })
})
