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

  it('takes spacing, radii, shadows and transition lengths from tokens', () => {
    const props = /(?<![\w-])(padding(?:-\w+)?|margin(?:-\w+)?|gap|border-radius|box-shadow|transition)\s*:\s*([^;]+);/g
    for (const m of rest.matchAll(props)) {
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

  it('gives each place on the home page its own colour token; parent captions stay readable on it', () => {
    const muted = resolveValue('var(--muted)', tokens)
    for (const place of ['math', 'language', 'space']) {
      expect(tokens, place).toHaveProperty(`place-${place}`)
      expect(tokens, place).toHaveProperty(`place-${place}-deep`)
      const rule = ruleDeclarations(css, `.place--${place},\n.path--${place}`)
      expect(rule['--place']).toBe(`var(--place-${place})`)
      expect(contrastRatio(muted, resolveValue(`var(--place-${place})`, tokens))).toBeGreaterThanOrEqual(4.5)
    }
    expect(ruleDeclarations(css, '.place__caption,\n.tile__caption').color).toBe('var(--muted)')
  })

  it('a passed stone carries a light print, so it differs from a stone ahead not only by colour', () => {
    expect(ruleDeclarations(css, '.stone--passed').background).toMatch(/var\(--surface\).*var\(--place-deep\)/)
    expect(ruleDeclarations(css, '.stone--ahead').background).toBe('var(--stone-ahead)')
  })

  it('screens fade in once with the calm duration, and not under reduced motion', () => {
    expect(ruleDeclarations(css, '.screen').animation).toBe('screen-in var(--duration-calm) ease-out')
    const reduced = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g
    const blocks = [...rest.matchAll(reduced)].map((m) => m[1] ?? '').join('\n')
    expect(blocks).toMatch(/\.screen\s*\{\s*animation: none;/)
  })

  it('draws Klíček in the mascot colours from the design system', () => {
    expect(tokens).toMatchObject({
      'klicek-yellow': '#ffc93c',
      'klicek-cheek': '#ffa07a',
      leaf: '#58c26a',
      'leaf-deep': '#4fb35f',
      'leaf-shade': '#3fa352',
      stem: '#3f9b4b',
      'root-gold': '#e8b23e',
      bark: '#9b6a43',
      soil: '#cfa77d',
      apple: '#e84a4a',
      blossom: '#ffb3c7',
    })
  })

  it('Klíček grows with one slow ease-out fade, and none under reduced motion', () => {
    const layer = ruleDeclarations(css, '.klicek__layer')
    expect(layer.transition).toMatch(/^opacity var\(--duration-grow\) ease-out$/)
    expect(layer.animation).toBeUndefined()
    const reduced = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g
    const blocks = [...rest.matchAll(reduced)].map((m) => m[1] ?? '').join('\n')
    expect(blocks).toMatch(/\.klicek__layer,\s*\.klicek__layer--after\s*\{\s*transition: none;/)
    // Fade-through: the new drawing starts only after the old one is gone
    expect(ruleDeclarations(css, '.klicek__layer--after')['transition-delay']).toBe('var(--duration-grow)')
  })
})
