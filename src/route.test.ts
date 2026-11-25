import { describe, expect, it } from 'vitest'
import { parseRoute, playHref } from './route.ts'

describe('parseRoute', () => {
  it.each([
    ['', { name: 'home' }],
    ['#/', { name: 'home' }],
    ['#/hra/', { name: 'home' }],
    ['#/hra/abc', { name: 'play', gameId: 'abc' }],
    ['#/hra/abc/', { name: 'play', gameId: 'abc' }],
    ['#/hra/%E0%A4%A', { name: 'home' }],
  ])('%j → %j', (hash, route) => {
    expect(parseRoute(hash)).toEqual(route)
  })

  it('round-trips playHref', () => {
    expect(parseRoute(playHref('a b'))).toEqual({ name: 'play', gameId: 'a b' })
  })
})
