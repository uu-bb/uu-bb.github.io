import { readFile } from 'node:fs/promises'
import { publicContentSchema, scanPublicValue } from './content-schema.mjs'

try {
  const raw = JSON.parse(
    await readFile(new URL('../src/data/public-content.generated.json', import.meta.url), 'utf8'),
  )
  const result = publicContentSchema.safeParse(raw)
  if (!result.success) {
    for (const issue of result.error.issues) {
      console.error(`PUBLIC_SCHEMA_BLOCKED:${issue.path.join('.')}:${issue.code}`)
    }
    process.exit(1)
  }

  const findings = scanPublicValue(result.data)
  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(`PUBLIC_SCAN_BLOCKED:${finding.rule}:${finding.path}`)
    }
    process.exit(1)
  }

  console.log(`PUBLIC_DATA_VALID:${result.data.projects.length}:${result.data.evidence.length}`)
} catch {
  console.error('PUBLIC_DATA_UNREADABLE')
  process.exit(1)
}
