import { useEffect, useState } from 'react'
import { PlayScreen } from './games/core/PlayScreen.tsx'
import type { GameRegistry } from './games/core/registry.ts'
import { games as appGames } from './games/registry.ts'
import { parseRoute, playHref } from './route.ts'

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App({ games = appGames }: { games?: GameRegistry }) {
  const route = parseRoute(useHash())

  if (route.name === 'play') {
    const game = games.get(route.gameId)
    if (game) return <PlayScreen key={game.id} game={game} />
    return (
      <main className="home">
        <h1 className="home__title">clevee</h1>
        <p className="home__lead">Tuhle hru neznám.</p>
        <a className="home__link" href="#/">
          Zpět domů
        </a>
      </main>
    )
  }

  const list = games.list()
  return (
    <main className="home">
      <h1 className="home__title">clevee</h1>
      {list.length === 0 ? (
        <p className="home__lead">Tady brzy budou hry.</p>
      ) : (
        <ul className="home__games">
          {list.map((g) => (
            <li key={g.id}>
              <a className="home__link" href={playHref(g.id)}>
                {g.title.cs}
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
