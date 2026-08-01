import { describe, expect, it } from 'vitest'
import { evidenceById, publicContent } from '../data/content'

describe('public content contract', () => {
  it('keeps three primary projects per role lens', () => {
    for (const ids of Object.values(publicContent.lenses)) {
      expect(ids).toHaveLength(3)
      expect(new Set(ids).size).toBe(3)
    }
  })

  it('resolves every project evidence reference exactly once', () => {
    const evidenceIds = new Set(publicContent.evidence.map((item) => item.id))
    expect(evidenceIds.size).toBe(publicContent.evidence.length)

    for (const project of publicContent.projects) {
      expect(project.evidenceIds.length).toBeGreaterThan(0)
      for (const id of project.evidenceIds) {
        expect(evidenceById.has(id)).toBe(true)
      }
    }
  })

  it('contains only abstract source references', () => {
    for (const sourceRef of publicContent.sourceRefs) {
      expect(sourceRef).toMatch(/^[a-z0-9-]+-v\d{8}$/)
    }
  })
})
