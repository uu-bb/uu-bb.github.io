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

const evidenceMediaSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    projectId: projectIdSchema,
    type: z.enum([
      'runtime-screenshot',
      'concept-visual',
      'architecture',
      'test-evidence',
    ]),
    src: z.string().regex(/^evidence\/[a-z0-9/-]+\.png$/),
    alt: z.string().min(1),
    caption: z.string().min(1),
    proofStatement: z.string().min(1),
    verifiedAt: z.string().date(),
    boundary: z.string().min(1),
    order: z.number().int().positive(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .strict()

const codeExampleSchema = z
  .object({
    title: z.string().min(1),
    language: z.string().min(1),
    code: z
      .string()
      .min(1)
      .refine((value) => value.split('\n').length <= 28, 'Code example must stay within 28 lines'),
    input: z.string().min(1),
    judgment: z.string().min(1),
    output: z.string().min(1),
    rationale: z.string().min(1),
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
    evidenceMediaIds: z.array(z.string()).optional(),
    tags: z.array(z.string()).min(1),
    github: z.string().url().optional(),
    details: z
      .object({
        problem: z.string().min(1),
        audience: z.array(z.string().min(1)).min(1),
        userFlow: z.array(z.string().min(1)).min(2),
        features: z.array(z.string().min(1)).min(2),
        architecture: z.array(z.string().min(1)).min(2),
        tradeoffs: z.array(z.string()).min(1),
        implementation: z.array(z.string()).min(1),
        failurePaths: z.array(z.string().min(1)).min(1),
        contribution: z.array(z.string().min(1)).min(1),
        codeExample: codeExampleSchema,
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
    evidenceMedia: z.array(evidenceMediaSchema).length(9),
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
        evidenceMedia: z.array(evidenceMediaSchema).length(9),
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
const privateOnlyPattern = new RegExp(['private', 'only'].join('_'), 'i')
const releaseCandidateAssetsPattern = new RegExp(['release', 'candidate', 'assets'].join('-'), 'i')
const xwechatFilesPattern = new RegExp(['xwechat', 'files'].join('_'), 'i')
const masterLabelPattern = new RegExp(`\\b${['Mas', 'ter'].join('')}\\b`)

const textRules = [
  ['ABSOLUTE_PATH', /(?:^|[\s"'`(])(?:[A-Za-z]:[\\/])/],
  ['USER_HOME_PATH', userHomePattern],
  ['MOBILE_NUMBER', /(?<![\d.])1[3-9]\d{9}(?![\d.])/],
  ['SECRET_TOKEN', /\b(?:gho|ghp|github_pat)_[A-Za-z0-9_]+\b/],
  ['OPENAI_TOKEN', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/],
  ['AWS_ACCESS_KEY', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['GOOGLE_API_KEY', /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ['SLACK_TOKEN', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['JWT_TOKEN', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ['PRIVATE_KEY', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/],
  [
    'DATABASE_CREDENTIAL',
    /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s:@/]+:[^\s@/]+@/i,
  ],
  [
    'GENERIC_SECRET_ASSIGNMENT',
    /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|passwd|pwd)\s*[:=]\s*["'][^"'\s]{8,}["']/i,
  ],
  ['INTERNAL_LABEL', internalLabelsPattern],
  ['INTERNAL_CITATION', new RegExp(forbiddenToken, 'i')],
  [['PRIVATE', 'ONLY'].join('_'), privateOnlyPattern],
  ['RELEASE_CANDIDATE_ASSETS', releaseCandidateAssetsPattern],
  [['XWECHAT', 'FILES'].join('_'), xwechatFilesPattern],
  ['MASTER_LABEL', masterLabelPattern],
]

const forbiddenFilePatterns = [
  /^(?:\.env)(?:\..+)?$/i,
  /^(?:id_rsa|id_ed25519)$/i,
  /\.(?:key|pem|p12|pfx)$/i,
]

export function isForbiddenPublicFileName(fileName) {
  const normalized = fileName.replaceAll('\\', '/').split('/').at(-1) ?? ''
  if (/^\.env(?:\..+)?\.example$/i.test(normalized) || normalized === '.env.example') {
    return false
  }
  return forbiddenFilePatterns.some((pattern) => pattern.test(normalized))
}

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
