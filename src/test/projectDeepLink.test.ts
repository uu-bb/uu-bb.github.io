import { describe, expect, it } from 'vitest'
import {
  createProjectChapterLink,
  createProjectDeepLink,
  readRequestedProjectId,
} from '../utils/projectDeepLink'

const projectIds = new Set([
  'job-assistant',
  'rag-knowledge-base',
  'xiaoyu',
  'agent-toolkit',
])

const hasProject = (projectId: string) => projectIds.has(projectId)

describe('project deep-link contract', () => {
  it.each([
    [
      'overview',
      'job-assistant',
      '/?project=job-assistant&focus=overview#job-assistant',
      '/?focus=overview#job-assistant',
    ],
    [
      'ai-app',
      'job-assistant',
      '/?project=job-assistant&focus=ai-app#job-assistant',
      '/?focus=ai-app#job-assistant',
    ],
    [
      'product',
      'xiaoyu',
      '/?project=xiaoyu&focus=product#xiaoyu',
      '/?focus=product#xiaoyu',
    ],
    [
      'python',
      'agent-toolkit',
      '/?project=agent-toolkit&focus=python#agent-toolkit',
      '/?focus=python#agent-toolkit',
    ],
  ] as const)(
    'keeps focus %s separate from project %s',
    (focus, projectId, cardHref, hashOnlyHref) => {
      expect(createProjectDeepLink(projectId, focus)).toBe(cardHref)
      expect(readRequestedProjectId(
        new URL(hashOnlyHref, 'https://portfolio.example'),
        hasProject,
      )).toBe(projectId)
    },
  )

  it('keeps the legacy project query as the chapter-link identity', () => {
    const href = createProjectChapterLink('job-assistant', 'ai-app', 'contribution')

    expect(href).toBe('/?project=job-assistant&focus=ai-app#contribution')
    expect(readRequestedProjectId(new URL(href, 'https://portfolio.example'), hasProject))
      .toBe('job-assistant')
  })

  it.each([
    '/?focus=product#not-a-project',
    '/?focus=product#%E0%A4%A',
    '/#job-assistant',
    '/?focus=slumber#job-assistant',
    '/?focus=wake#job-assistant',
  ])('rejects an invalid or non-project hash without throwing: %s', (href) => {
    expect(readRequestedProjectId(new URL(href, 'https://portfolio.example'), hasProject))
      .toBeNull()
  })
})
