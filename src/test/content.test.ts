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

  it('gives every project a complete explanation contract', () => {
    for (const project of publicContent.projects) {
      const details = project.details as Record<string, unknown>

      expect(details.audience).toEqual(expect.arrayContaining([expect.any(String)]))
      expect(details.userFlow).toEqual(expect.arrayContaining([expect.any(String)]))
      expect(details.features).toEqual(expect.arrayContaining([expect.any(String)]))
      expect(details.architecture).toEqual(expect.arrayContaining([expect.any(String)]))
      expect(details.failurePaths).toEqual(expect.arrayContaining([expect.any(String)]))
      expect(details.contribution).toEqual(expect.arrayContaining([expect.any(String)]))
      expect(details.codeExample).toMatchObject({
        title: expect.any(String),
        language: expect.any(String),
        code: expect.any(String),
        input: expect.any(String),
        judgment: expect.any(String),
        output: expect.any(String),
        rationale: expect.any(String),
        sourceRefs: expect.arrayContaining([expect.any(String)]),
      })
    }
  })

  it('keeps public code examples short and free of local-source clues', () => {
    const forbiddenCitation = ['codex', 'file', 'citation'].join('-')
    const forbiddenPrivateField = ['private', 'Repository'].join('')

    for (const project of publicContent.projects) {
      const codeExample = (project.details as Record<string, unknown>).codeExample as {
        code: string
        sourceRefs: string[]
      }

      expect(codeExample.code.split('\n').length).toBeLessThanOrEqual(28)
      expect(codeExample.code).not.toMatch(/[A-Za-z]:[\\/]/)
      expect(codeExample.code.toLowerCase()).not.toContain(forbiddenCitation)
      expect(codeExample.code).not.toContain(forbiddenPrivateField)
      expect(codeExample.sourceRefs).toEqual(
        expect.arrayContaining([expect.stringMatching(/^[a-z0-9-]+-v\d{8}$/)]),
      )
    }
  })
})
