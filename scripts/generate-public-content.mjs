import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import {
  privateFactsSchema,
  publicContentSchema,
  scanPublicValue,
  toPublicContent,
} from './content-schema.mjs'

const inputPath = process.env.PORTFOLIO_FACTS_PATH
if (!inputPath) {
  console.error('PRIVATE_INPUT_REQUIRED')
  process.exit(1)
}

const reportSchemaError = (error) => {
  for (const issue of error.issues ?? []) {
    console.error(`SCHEMA_ERROR:${issue.path.join('.')}:${issue.code}`)
  }
}

try {
  const raw = JSON.parse(await readFile(inputPath, 'utf8'))
  const privateResult = privateFactsSchema.safeParse(raw)
  if (!privateResult.success) {
    reportSchemaError(privateResult.error)
    process.exit(1)
  }

  const publicContent = toPublicContent(privateResult.data)
  const publicResult = publicContentSchema.safeParse(publicContent)
  if (!publicResult.success) {
    reportSchemaError(publicResult.error)
    process.exit(1)
  }

  const findings = scanPublicValue(publicResult.data)
  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(`PUBLIC_DATA_BLOCKED:${finding.rule}:${finding.path}`)
    }
    process.exit(1)
  }

  const outputPath = resolve('src/data/public-content.generated.json')
  const temporaryPath = `${outputPath}.tmp`
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(temporaryPath, `${JSON.stringify(publicResult.data, null, 2)}\n`, 'utf8')
  await rename(temporaryPath, outputPath)
  console.log(`PUBLIC_DATA_READY:${publicResult.data.projects.length}:${publicResult.data.evidence.length}`)
} catch (error) {
  console.error(`PUBLIC_DATA_FAILED:${error instanceof SyntaxError ? 'INVALID_JSON' : 'IO_ERROR'}`)
  process.exit(1)
}
