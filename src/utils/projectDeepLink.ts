import type { RoleLens } from '../data/types'
import { isRoleLens } from './focus'

export function createProjectDeepLink(projectId: string, focus: RoleLens): string {
  const encodedProjectId = encodeURIComponent(projectId)
  return `/?project=${encodedProjectId}&focus=${focus}#${encodedProjectId}`
}

export function createProjectChapterLink(
  projectId: string,
  focus: RoleLens,
  chapterId: string,
): string {
  return `/?project=${encodeURIComponent(projectId)}&focus=${focus}#${encodeURIComponent(chapterId)}`
}

export function readRequestedProjectId(
  url: URL,
  hasProject: (projectId: string) => boolean,
): string | null {
  const legacyProjectId = url.searchParams.get('project')
  if (legacyProjectId && hasProject(legacyProjectId)) return legacyProjectId
  if (!isRoleLens(url.searchParams.get('focus'))) return null

  try {
    const projectId = decodeURIComponent(url.hash.replace(/^#/, ''))
    return projectId && hasProject(projectId) ? projectId : null
  } catch {
    return null
  }
}
