import { describe, expect, it } from 'vitest'
import { dummyGame } from '../games/core/testing/dummyGame.tsx'
import { groupByModule } from './modules.ts'

const game = (id: string, module: 'math' | 'language' | 'space') => ({ ...dummyGame, id, module })

describe('groupByModule', () => {
  it('puts each game into its place, keeping registry order', () => {
    const places = groupByModule([game('a', 'space'), game('b', 'math'), game('c', 'space')])
    expect(places.map((p) => [p.module, p.games.map((g) => g.id)])).toEqual([
      ['math', ['b']],
      ['language', []],
      ['space', ['a', 'c']],
    ])
  })

  it('keeps all three places when there are no games', () => {
    expect(groupByModule([])).toEqual([
      { module: 'math', games: [] },
      { module: 'language', games: [] },
      { module: 'space', games: [] },
    ])
  })
})
