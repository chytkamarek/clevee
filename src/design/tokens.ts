// Read-only helpers over the stylesheet, so tests can hold the CSS to the design system.

const ROOT_BLOCK = /:root\s*\{([^}]*)\}/

/** The `:root { … }` block, or '' when there is none. */
export function rootBlock(css: string): string {
  return ROOT_BLOCK.exec(stripComments(css))?.[1] ?? ''
}

/** The stylesheet with its `:root` block and comments removed. */
export function outsideRoot(css: string): string {
  return stripComments(css).replace(ROOT_BLOCK, '')
}

/** Custom properties declared in `:root`, without the leading `--`. */
export function rootTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {}
  for (const m of rootBlock(css).matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    tokens[m[1]] = m[2].trim()
  }
  return tokens
}

/** Declarations of the first rule whose selector is exactly `selector`. */
export function ruleDeclarations(css: string, selector: string): Record<string, string> {
  const clean = stripComments(css)
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const body = new RegExp(`(?:^|[}\\s])${escaped}\\s*\\{([^}]*)\\}`).exec(clean)?.[1] ?? ''
  const decls: Record<string, string> = {}
  for (const m of body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)) decls[m[1]] = m[2].trim()
  return decls
}

/** Follows `var(--name)` through the tokens until it reaches a literal value. */
export function resolveValue(value: string, tokens: Record<string, string>): string {
  let current = value.trim()
  for (let i = 0; i < 10; i++) {
    const m = /^var\(--([\w-]+)\)$/.exec(current)
    if (!m) return current
    const next = tokens[m[1]]
    if (next === undefined) throw new Error(`Unknown token --${m[1]}`)
    current = next.trim()
  }
  throw new Error(`Token chain too deep: ${value}`)
}

/** WCAG 2 contrast ratio between two 3- or 6-digit hex colours. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) throw new Error(`Not a hex colour: ${hex}`)
  const full = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}
