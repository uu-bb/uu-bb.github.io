import generatedContent from './public-content.generated.json'
import type { PublicContent } from './types'

export const publicContent = generatedContent as PublicContent

export const evidenceById = new Map(
  publicContent.evidence.map((evidence) => [evidence.id, evidence]),
)

export const projectById = new Map(
  publicContent.projects.map((project) => [project.id, project]),
)
