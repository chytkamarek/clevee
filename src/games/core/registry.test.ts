import { describe, expect, it } from 'vitest'
import { createRegistry } from './registry.ts'
import { dummyGame } from './testing/dummyGame.tsx'

describe('createRegistry', () => {
  it('finds a registered game by id', () => {
    const registry = createRegistry([dummyGame])
    expect(registry.get('dummy')).toBe(dummyGame)
    expect(registry.list()).toEqual([dummyGame])
  })

  it('returns undefined for an unknown id', () => {
    expect(createRegistry([dummyGame]).get('nope')).toBeUndefined()
  })

  it('throws on a duplicate id', () => {
    expect(() => createRegistry([dummyGame, { ...dummyGame }])).toThrow(/dummy/)
  })
})
