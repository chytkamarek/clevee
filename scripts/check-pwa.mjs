// Post-build guard for the PWA (issue #1, AC3): run after `npm run build`.
// Fails when the build would not be installable or would not work offline:
// missing manifest / service worker, manifest icon missing on disk, required
// manifest fields, or index.html / app assets missing from the SW precache.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dist = process.argv[2] ?? 'dist'
const errors = []
const read = (p) => readFileSync(join(dist, p), 'utf8')

if (!existsSync(join(dist, 'manifest.webmanifest'))) errors.push('dist/manifest.webmanifest chybí')
if (!existsSync(join(dist, 'sw.js'))) errors.push('dist/sw.js chybí')

if (errors.length === 0) {
  const manifest = JSON.parse(read('manifest.webmanifest'))
  for (const field of ['name', 'short_name', 'start_url', 'display', 'icons']) {
    if (!manifest[field]) errors.push(`manifest: chybí ${field}`)
  }
  if (!['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display)) {
    errors.push(`manifest: display "${manifest.display}" není instalovatelný`)
  }
  const icons = manifest.icons ?? []
  for (const icon of icons) {
    if (!existsSync(join(dist, icon.src))) errors.push(`manifest: ikona ${icon.src} není v dist/`)
  }
  for (const size of ['192x192', '512x512']) {
    if (!icons.some((i) => i.sizes === size && (i.purpose ?? 'any').includes('any'))) {
      errors.push(`manifest: chybí ikona ${size} (purpose any)`)
    }
  }
  if (!icons.some((i) => (i.purpose ?? '').includes('maskable'))) {
    errors.push('manifest: chybí maskable ikona')
  }

  const html = read('index.html')
  if (!html.includes('rel="manifest"')) errors.push('index.html neodkazuje na manifest')
  if (!html.includes('registerSW.js') && !html.includes('serviceWorker')) {
    errors.push('index.html neregistruje service worker')
  }

  // Everything the page needs offline must be in the precache
  const sw = read('sw.js')
  const assets = existsSync(join(dist, 'assets')) ? readdirSync(join(dist, 'assets')) : []
  for (const file of ['index.html', ...assets.map((a) => `assets/${a}`)]) {
    if (!sw.includes(`"${file}"`)) errors.push(`precache: chybí ${file}`)
  }
  if (!/createHandlerBoundToURL\("\/?index\.html"\)/.test(sw)) {
    errors.push('sw: chybí navigateFallback na index.html (offline reload podcesty)')
  }
}

if (errors.length) {
  console.error(`PWA check selhal:\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log('PWA check OK')
