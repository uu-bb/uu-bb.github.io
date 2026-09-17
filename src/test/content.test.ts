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

  it('publishes exactly the six approved media records in frozen order', () => {
    const media = publicContent.evidenceMedia
    const mediaIds = media.map((item) => item.id)
    const projectMediaIds = (projectId: string) => {
      const project = publicContent.projects.find((item) => item.id === projectId)
      return project?.evidenceMediaIds
    }

    expect(media).toHaveLength(6)
    expect(new Set(mediaIds).size).toBe(media.length)
    expect(mediaIds).toEqual([
      'ja-analysis',
      'ja-preview-confirmation',
      'ja-validation-guard',
      'rag-query-with-sources',
      'rag-no-match-fallback',
      'rag-knowledge-status',
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
    expect(mediaIds).not.toContain('ja-04')

    const forbiddenMediaPath = new RegExp(
      `(?:${['release', 'candidate', 'assets'].join('-')}|${['private', 'only'].join('_')}|[A-Za-z]:[\\\\/])`,
    )
    for (const item of media) {
      expect(item.src).toMatch(/^evidence\//)
      expect(item.src).not.toMatch(forbiddenMediaPath)
      expect(item.alt).not.toHaveLength(0)
      expect(item.caption).not.toHaveLength(0)
      expect(item.proofStatement).not.toHaveLength(0)
      expect(item.verifiedAt).toMatch(/^2026-08-0[45]$/)
      expect(item.boundary).not.toHaveLength(0)
      expect(item.width).toBeGreaterThan(0)
      expect(item.height).toBeGreaterThan(0)
    }
  })

  it('states outcomes instead of test counts', () => {
    const serialized = JSON.stringify(publicContent)

    for (const retired of [
      '32/32',
      '436/436',
      '7/7',
      '10 项专项测试',
      '项测试通过',
      '自动化测试通过',
    ]) {
      expect(serialized).not.toContain(retired)
    }
    expect(serialized).not.toContain('"framework"')

    for (const evidence of publicContent.evidence) {
      expect(evidence.label).not.toMatch(/\d+\s*\/\s*\d+/)
      expect(evidence.boundary).not.toHaveLength(0)
    }
  })

  it('retires the xiaoyu project and its media completely', () => {
    const serialized = JSON.stringify(publicContent)

    expect(publicContent.projects.some((project) => project.id === 'xiaoyu')).toBe(false)
    expect(publicContent.evidenceMedia.some((item) => item.projectId === 'xiaoyu')).toBe(false)
    for (const evidence of publicContent.evidence) {
      expect(evidence.id).not.toContain('xiaoyu')
    }
    expect(serialized).not.toContain('xiaoyu')
    expect(serialized).not.toContain('小u鱼')
  })

  it('publishes the internship and education records from the presales resume', () => {
    expect(publicContent.internships).toHaveLength(2)
    expect(publicContent.internships.map((item) => item.company)).toEqual([
      '蓝色光标-思恩客',
      '深圳猞猁保科技有限公司',
    ])
    for (const internship of publicContent.internships) {
      expect(internship.highlights.length).toBeGreaterThan(0)
      expect(internship.period).not.toHaveLength(0)
      expect(internship.sourceRefs).toEqual(
        expect.arrayContaining([expect.stringMatching(/^[a-z0-9-]+-v\d{8}$/)]),
      )
    }
    expect(publicContent.education).toMatchObject({
      school: '电子科技大学中山学院',
      major: '人工智能',
      degree: '本科',
    })
    expect(publicContent.education.courses.length).toBeGreaterThan(0)
  })

  it('uses the approved LightRAG copy and excludes audit-only fields', () => {
    const approvedCopy =
      '扩展实验：LightRAG。离线编排链路已接通，基础调用与流程连接验证完成；真实 Ollama 检索与回答效果仍待验证。'
    const lightRag = publicContent.experiments.find((item) => item.id === 'lightrag')
    const serialized = JSON.stringify(publicContent)
    const auditOnlyFields = new RegExp(
      `(?:humanApproved|readyForPhase2B|sourceCategory|${['private', 'only'].join('_')})`,
    )

    expect(lightRag?.summary).toBe(approvedCopy)
    expect(serialized).not.toContain(['29', '29'].join('/'))
    expect(serialized).not.toMatch(auditOnlyFields)
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
