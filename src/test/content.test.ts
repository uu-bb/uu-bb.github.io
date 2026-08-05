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

  it('publishes exactly the nine human-approved media records in frozen order', () => {
    const content = publicContent as typeof publicContent & {
      evidenceMedia: Array<{
        id: string
        projectId: string
        type: string
        src: string
        alt: string
        caption: string
        proofStatement: string
        verifiedAt: string
        boundary: string
        order: number
        width: number
        height: number
      }>
    }
    const media = content.evidenceMedia
    const mediaIds = media.map((item) => item.id)
    const projectMediaIds = (projectId: string) => {
      const project = publicContent.projects.find((item) => item.id === projectId) as
        | (typeof publicContent.projects[number] & { evidenceMediaIds: string[] })
        | undefined
      return project?.evidenceMediaIds
    }

    expect(media).toHaveLength(9)
    expect(new Set(mediaIds).size).toBe(media.length)
    expect(mediaIds).toEqual([
      'ja-analysis',
      'ja-preview-confirmation',
      'ja-validation-guard',
      'rag-query-with-sources',
      'rag-no-match-fallback',
      'rag-knowledge-status',
      'xiaoyu-concept-main',
      'xiaoyu-v3-architecture',
      'xiaoyu-v3-tests',
    ])
    expect(projectMediaIds('job-assistant')).toEqual([
      'ja-analysis',
      'ja-preview-confirmation',
      'ja-validation-guard',
    ])
    expect(projectMediaIds('rag-knowledge-base')).toEqual([
      'rag-query-with-sources',
      'rag-no-match-fallback',
      'rag-knowledge-status',
    ])
    expect(projectMediaIds('xiaoyu')).toEqual([
      'xiaoyu-concept-main',
      'xiaoyu-v3-architecture',
      'xiaoyu-v3-tests',
    ])
    expect(mediaIds).not.toContain('ja-04')

    for (const item of media) {
      expect(item.src).toMatch(/^evidence\//)
      expect(item.alt).not.toHaveLength(0)
      expect(item.caption).not.toHaveLength(0)
      expect(item.proofStatement).not.toHaveLength(0)
      expect(item.verifiedAt).toMatch(/^2026-08-0[45]$/)
      expect(item.boundary).not.toHaveLength(0)
      expect(item.width).toBeGreaterThan(0)
      expect(item.height).toBeGreaterThan(0)
    }
  })

  it('keeps the xiaoyu media and current test claim inside the approved boundary', () => {
    const content = publicContent as typeof publicContent & {
      evidenceMedia: Array<{ projectId: string; type: string }>
    }
    const xiaoyuMedia = content.evidenceMedia.filter((item) => item.projectId === 'xiaoyu')
    const xiaoyuEvidence = publicContent.evidence.find((item) => item.id === 'xiaoyu-tests')

    expect(xiaoyuMedia.map((item) => item.type)).toEqual([
      'concept-visual',
      'architecture',
      'test-evidence',
    ])
    expect(xiaoyuMedia.some((item) => item.type === 'runtime-screenshot')).toBe(false)
    expect(xiaoyuEvidence).toMatchObject({
      label: '436 项 V3 自动化测试通过',
      detail: '436/436 项当前 V3 自动化测试通过',
      framework: 'pytest',
      verifiedAt: '2026-08-05',
    })
    expect(xiaoyuEvidence?.boundary).toContain('不是代码覆盖率')
  })

  it('uses the only approved LightRAG copy and excludes audit-only fields', () => {
    const approvedCopy = '扩展实验：LightRAG。完成 4 项编排流程测试，验证基础调用与流程连接；真实 Ollama 检索和回答效果仍待验证。'
    const lightRag = publicContent.experiments.find((item) => item.id === 'lightrag')
    const serialized = JSON.stringify(publicContent)

    expect(lightRag?.summary).toBe(approvedCopy)
    expect(serialized).not.toContain(['29', '29'].join('/'))
    expect(serialized).not.toMatch(/(?:humanApproved|readyForPhase2B|sourceCategory|private_only)/)
    expect(serialized).not.toMatch(/(?:^|["'\s])[A-Za-z]:[\\/]/)
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
