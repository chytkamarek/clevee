// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrastRatio, outsideRoot, resolveValue, rootTokens, ruleDeclarations } from './tokens.ts'

describe('token helpers', () => {
  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#ff8a3d')).toBeCloseTo(2.35, 2)
  })

  it('reads :root tokens and resolves var() chains', () => {
    const sheet = ':root { --a: #123456; --b: var(--a); } .x { color: var(--b); }'
    const tokens = rootTokens(sheet)
    expect(tokens).toEqual({ a: '#123456', b: 'var(--a)' })
    expect(resolveValue(ruleDeclarations(sheet, '.x').color, tokens)).toBe('#123456')
    expect(outsideRoot(sheet)).not.toContain('#123456')
  })
})

// Vitest does not load CSS imports (`?raw` comes back empty), so read the file itself
const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')

describe('src/index.css follows the design system', () => {
  const tokens = rootTokens(css)
  const rest = outsideRoot(css)

  it('has no colour literals outside :root', () => {
    expect(rest).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(rest).not.toMatch(/\b(rgba?|hsla?)\(/i)
  })

  it('declares the design-system tokens in :root', () => {
    for (const name of [
      'space-2', 'space-3', 'space-4', 'space-5', 'space-6', 'space-8', 'space-10',
      'radius-sm', 'radius-md', 'radius-lg',
      'control-min', 'button-min', 'content-max',
      'shadow-card', 'duration-calm',
    ]) {
      expect(tokens, name).toHaveProperty(name)
    }
  })

  it('takes radii, shadows and transition lengths from tokens', () => {
    for (const m of rest.matchAll(/(border-radius|box-shadow|transition)\s*:\s*([^;]+);/g)) {
      expect(m[2], m[0]).not.toMatch(/\d(px|rem|em|ms|s)\b/)
    }
  })

  it('main button text reads at least 4.5:1 on its background', () => {
    const button = ruleDeclarations(css, '.play__button')
    const fg = resolveValue(button.color, tokens)
    const bg = resolveValue(button.background, tokens)
    expect(button.color).toBe('var(--fg)')
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5)
  })

  it('a miss is plain muted text, never red or bold', () => {
    const bad = ruleDeclarations(css, '.play__result--bad')
    expect(bad.color).toBe('var(--muted)')
    expect(bad['font-weight']).toBe('400')
  })
})
