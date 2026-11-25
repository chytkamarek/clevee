import { useEffect, useState } from 'react'
import { browserStorage } from './games/core/attempts.ts'
import { PlayScreen } from './games/core/PlayScreen.tsx'
import type { GameRegistry } from './games/core/registry.ts'
import { games as appGames } from './games/registry.ts'
import { GamePath } from './hub/GamePath.tsx'
import { Places } from './hub/Home.tsx'
import { stageFor } from './klicek/growth.ts'
import { Klicek } from './klicek/Klicek.tsx'
import { markSeen, syncGrowth } from './klicek/progress.ts'
import { parseRoute, pathHref, type Route } from './route.ts'

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

/** Klíček as grown as the child's solved tasks; what it looked like last time fades into now. */
function HomeMascot() {
  const [growth] = useState(() => syncGrowth(browserStorage()))
  useEffect(() => markSeen(browserStorage(), growth), [growth])
  return <Klicek from={stageFor(growth.seen)} to={stageFor(growth.solved)} />
}

function Screen({ route, games }: { route: Route; games: GameRegistry }) {
  if (route.name !== 'home') {
    const game = games.get(route.gameId)
    if (!game) {
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
    if (route.name === 'path') return <GamePath game={game} />
    return <PlayScreen game={game} difficulty={route.level} backHref={pathHref(game.id)} />
  }

  return (
    <main className="home">
      <h1 className="visually-hidden">clevee</h1>
      <HomeMascot />
      <Places games={games.list()} />
    </main>
  )
}

/** A level past the game's last one plays the last one. */
function clampLevel(route: Route, games: GameRegistry): Route {
  if (route.name !== 'play') return route
  const game = games.get(route.gameId)
  return game ? { ...route, level: Math.min(route.level, Math.max(1, game.levels)) } : route
}

const screenKey = (route: Route) =>
  route.name === 'home' ? 'home' : route.name === 'path' ? `path/${route.gameId}` : `play/${route.gameId}/${route.level}`

export default function App({ games = appGames }: { games?: GameRegistry }) {
  const route = clampLevel(parseRoute(useHash()), games)
  // New key per screen → the screen mounts fresh and fades in once (CSS, off under reduced motion)
  return (
    <div className="screen" key={screenKey(route)}>
      <Screen route={route} games={games} />
    </div>
  )
}
