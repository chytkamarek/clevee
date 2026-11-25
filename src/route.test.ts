import { describe, expect, it } from 'vitest'
import { parseRoute, pathHref, playHref } from './route.ts'

describe('parseRoute', () => {
  it.each([
    ['', { name: 'home' }],
    ['#/', { name: 'home' }],
    ['#/hra/', { name: 'home' }],
    ['#/hra/abc', { name: 'path', gameId: 'abc' }],
    ['#/hra/abc/', { name: 'path', gameId: 'abc' }],
    ['#/hra/abc/2', { name: 'play', gameId: 'abc', level: 2 }],
    ['#/hra/abc/12/', { name: 'play', gameId: 'abc', level: 12 }],
    ['#/hra/abc/0', { name: 'home' }],
    ['#/hra/abc/x', { name: 'home' }],
    ['#/hra/%E0%A4%A', { name: 'home' }],
    ['#/hra/%E0%A4%A/1', { name: 'home' }],
  ])('%j → %j', (hash, route) => {
    expect(parseRoute(hash)).toEqual(route)
  })

  it('round-trips pathHref and playHref', () => {
    expect(parseRoute(pathHref('a b'))).toEqual({ name: 'path', gameId: 'a b' })
    expect(parseRoute(playHref('a/b', 3))).toEqual({ name: 'play', gameId: 'a/b', level: 3 })
  })
})
