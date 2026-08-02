export type RoleLens = 'overview' | 'product' | 'ai-app' | 'python'

export type ProjectStatus = 'completed' | 'iterating' | 'prototype' | 'archived'

export type VerificationStatus = 'verified' | 'partial' | 'planned'

export interface EvidenceRecord {
  id: string
  label: string
  detail: string
  framework?: string
  status: VerificationStatus
  verifiedAt?: string
  boundary?: string
  sourceRefs: string[]
}

export interface ProjectCase {
  id: string
  title: string
  shortTitle: string
  role: string
  status: ProjectStatus
  statusLabel: string
  problem: string
  keyImplementation: string
  evidenceIds: string[]
  tags: string[]
  github?: string
  details: {
    problem: string
    audience: string[]
    userFlow: string[]
    features: string[]
    architecture: string[]
    tradeoffs: string[]
    implementation: string[]
    failurePaths: string[]
    contribution: string[]
    codeExample: {
      title: string
      language: string
      code: string
      input: string
      judgment: string
      output: string
      rationale: string
      sourceRefs: string[]
    }
    boundary: string
  }
  sourceRefs: string[]
}

export interface Experiment {
  id: string
  title: string
  summary: string
  status: ProjectStatus
  statusLabel: string
  tags: string[]
  github?: string
  sourceRefs: string[]
}

export interface PublicContent {
  generatedAt: string
  profile: {
    name: string
    brand: string
    role: string
    tagline: string
    statusLine: string
    email: string
    github: string
    skills: string[]
  }
  sourceRefs: string[]
  lenses: Record<RoleLens, string[]>
  evidence: EvidenceRecord[]
  projects: ProjectCase[]
  experiments: Experiment[]
}
