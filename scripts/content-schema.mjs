import { z } from 'zod'

const sourceRefSchema = z.string().regex(/^[a-z0-9-]+-v\d{8}$/)
const projectIdSchema = z.string().regex(/^[a-z0-9-]+$/)

const projectStatusSchema = z.enum([
  'completed',
  'iterating',
  'prototype',
  'archived',
])

const verificationStatusSchema = z.enum(['verified', 'partial', 'planned'])

const evidenceBaseSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    label: z.string().min(1),
    detail: z.string().min(1),
    framework: z.string().min(1).optional(),
    status: verificationStatusSchema,
    verifiedAt: z.string().date().optional(),
    boundary: z.string().min(1).optional(),
    sourceRefs: z.array(sourceRefSchema).min(1),
  })
  .strict()

const publicProjectSchema = z
  .object({
    id: projectIdSchema,
    title: z.string().min(1),
    shortTitle: z.string().min(1),
    role: z.string().min(1),
    status: projectStatusSchema,
    statusLabel: z.string().min(1),
    problem: z.string().min(1),
    keyImplementation: z.string().min(1),
    evidenceIds: z.array(z.string()).min(1),
    tags: z.array(z.string()).min(1),
    github: z.string().url().optional(),
    details: z
      .object({
        problem: z.string().min(1),
        tradeoffs: z.array(z.string()).min(1),
        implementation: z.array(z.string()).min(1),
        boundary: z.string().min(1),
      })
      .strict(),
    sourceRefs: z.array(sourceRefSchema).min(1),
  })
  .strict()

const experimentSchema = z
  .object({
    id: projectIdSchema,
    title: z.string().min(1),
    summary: z.string().min(1),
    status: projectStatusSchema,
    statusLabel: z.string().min(1),
    tags: z.array(z.string()).min(1),
    github: z.string().url().optional(),
    sourceRefs: z.array(sourceRefSchema).min(1),
  })
  .strict()

const profileSchema = z
  .object({
    name: z.string().min(1),
    brand: z.string().min(1),
    role: z.string().min(1),
    tagline: z.string().min(1),
    statusLine: z.string().min(1),
    email: z.string().email(),
    github: z.string().url(),
    skills: z.array(z.string()).length(4),
  })
  .strict()

const lensesSchema = z
  .object({
    overview: z.array(projectIdSchema).length(3),
    product: z.array(projectIdSchema).length(3),
    'ai-app': z.array(projectIdSchema).length(3),
    python: z.array(projectIdSchema).length(3),
  })
  .strict()

export const publicContentSchema = z
  .object({
    generatedAt: z.string().date(),
    profile: profileSchema,
    sourceRefs: z.array(sourceRefSchema).min(1),
    lenses: lensesSchema,
    evidence: z.array(evidenceBaseSchema).min(1),
    projects: z.array(publicProjectSchema).min(3),
    experiments: z.array(experimentSchema),
  })
  .strict()

const privateEvidenceSchema = evidenceBaseSchema.extend({
  visibility: z.enum(['public', 'internal']),
})

export const privateFactsSchema = z
  .object({
    public: z
      .object({
        generatedAt: z.string().date(),
        profile: profileSchema,
        sourceRefs: z.array(sourceRefSchema).min(1),
        lenses: lensesSchema,
        evidence: z.array(privateEvidenceSchema).min(1),
        projects: z.array(publicProjectSchema).min(3),
        experiments: z.array(experimentSchema),
      })
      .strict(),
    internal: z
      .object({
        sourceCatalog: z.record(sourceRefSchema, z.string().min(1)),
        verificationNotes: z.array(z.string()),
      })
      .strict(),
  })
  .strict()

const forbiddenFieldNames = new Set([
  'sourcePath',
  'sourceNote',
  'sourceCatalog',
  'privateRepository',
  'internalFileName',
  'localPath',
  'phone',
  'visibility',
])

const forbiddenToken = ['codex', 'file', 'citation'].join('-')
const userHomePattern = new RegExp(
  `(?:${['/', 'Users', '/'].join('')}|${['/', 'home', '/'].join('')}|${['\\\\', 'Users', '\\\\'].join('')})`,
  'i',
)
const internalLabelsPattern = new RegExp(
  `${['内', '部', '母', '库'].join('')}|${['仅', '用', '于', '岗', '位', '定', '制'].join('')}`,
)

const textRules = [
  ['ABSOLUTE_PATH', /(?:^|[\s"'`(])(?:[A-Za-z]:[\\/])/],
  ['USER_HOME_PATH', userHomePattern],
  ['MOBILE_NUMBER', /(?<![\d.])1[3-9]\d{9}(?![\d.])/],
  ['SECRET_TOKEN', /\b(?:gho|ghp|github_pat)_[A-Za-z0-9_]+\b/],
  ['INTERNAL_LABEL', internalLabelsPattern],
  ['INTERNAL_CITATION', new RegExp(forbiddenToken, 'i')],
]

export function scanPublicValue(value, path = '$', findings = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanPublicValue(item, `${path}[${index}]`, findings))
    return findings
  }

  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (forbiddenFieldNames.has(key)) {
        findings.push({ rule: 'FORBIDDEN_FIELD', path: `${path}.${key}` })
      }
      scanPublicValue(nested, `${path}.${key}`, findings)
    }
    return findings
  }

  if (typeof value === 'string') {
    for (const [rule, pattern] of textRules) {
      if (pattern.test(value)) findings.push({ rule, path })
    }
  }

  return findings
}

export function toPublicContent(privateFacts) {
  const { evidence, ...rest } = privateFacts.public
  return {
    ...rest,
    evidence: evidence
      .filter((item) => item.visibility === 'public')
      .map(({ visibility: _visibility, ...item }) => item),
  }
}
