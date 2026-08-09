/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const editorialStyles = readFileSync(resolve(process.cwd(), 'src/editorial.css'), 'utf8')

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function ruleCount(selector: string) {
  return editorialStyles.match(new RegExp(`${escapeRegExp(selector)}\\s*\\{`, 'g'))?.length ?? 0
}

function ruleBody(selector: string) {
  return editorialStyles.match(new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

function ruleBodies(selector: string) {
  return [...editorialStyles.matchAll(
    new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`, 'g'),
  )].map((match) => match[1])
}

describe('Unit 8 editorial CSS contracts', () => {
  it('keeps the Phase 2C Hero state selectors present and unshadowed', () => {
    expect(ruleCount('.hero-stage.is-wake.is-wake-image-ready .hero-stage__media--sleep')).toBe(1)
    expect(ruleCount('.hero-stage.is-wake.is-wake-image-ready .hero-stage__media--wake')).toBe(1)
    expect(ruleCount('.hero-stage.is-wake .hero-lab-status__dot')).toBe(1)
    expect(ruleCount('.hero-wake:focus-visible')).toBe(1)
    expect(editorialStyles).not.toContain('is-awake')
  })

  it('provides one semantic rule for each Phase 3A presentation capability', () => {
    const uniqueSelectors = [
      '.case-hero__title h1:focus',
      '.case-media-evidence__marker',
      '.case-media-evidence__original',
    ]

    uniqueSelectors.forEach((selector) => expect(ruleCount(selector)).toBe(1))
    expect(ruleCount('.lens-current-state')).toBe(2)
    expect(ruleCount('.case-contribution')).toBe(3)
    expect(ruleBodies('.lens-current-state'))
      .toContainEqual(expect.stringContaining('grid-template-columns: max-content'))
    expect(ruleBody('.case-media-evidence__original')).toContain('min-height: 44px')
    expect(ruleBodies('.case-contribution'))
      .toContainEqual(expect.stringContaining('grid-template-columns: minmax(260px'))
  })

  it('preserves the Phase 2C reduced-motion contract and disables lens animation', () => {
    expect(editorialStyles.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)/g)).toHaveLength(1)
    const reducedMotionStyles = editorialStyles.slice(
      editorialStyles.indexOf('@media (prefers-reduced-motion: reduce)'),
    )

    expect(reducedMotionStyles).toMatch(/\.hero-wake:active\s*\{\s*transform:\s*none/)
    expect(reducedMotionStyles).toMatch(/\.lens-story\s*\{\s*animation:\s*none/)
  })
})
