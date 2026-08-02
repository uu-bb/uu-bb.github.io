import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative, resolve } from 'node:path'
import { isForbiddenPublicFileName, scanPublicValue } from './content-schema.mjs'

const mode = process.argv[2]
if (!['repo', 'dist'].includes(mode)) {
  console.error('SCAN_MODE_REQUIRED')
  process.exit(1)
}

const root = resolve(mode === 'dist' ? 'dist' : '.')
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', 'coverage', 'test-results'])
const textExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.mjs',
  '.md',
  '.map',
  '.ts',
  '.tsx',
  '.txt',
  '.xml',
  '.yml',
  '.yaml',
])

const files = []
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) await collect(join(directory, entry.name))
      continue
    }
    if (
      textExtensions.has(extname(entry.name).toLowerCase()) ||
      isForbiddenPublicFileName(entry.name)
    ) {
      files.push(join(directory, entry.name))
    }
  }
}

try {
  await collect(root)
  let blocked = 0
  for (const file of files) {
    if (isForbiddenPublicFileName(file)) {
      blocked += 1
      console.error(`SENSITIVE_SCAN_BLOCKED:${relative(root, file)}:FORBIDDEN_FILE:1`)
      continue
    }
    const content = await readFile(file, 'utf8')
    const findings = scanPublicValue(content)
    if (findings.length > 0) {
      blocked += findings.length
      const ruleIds = [...new Set(findings.map((finding) => finding.rule))].sort()
      console.error(
        `SENSITIVE_SCAN_BLOCKED:${relative(root, file)}:${ruleIds.join(',')}:${findings.length}`,
      )
    }
  }

  if (blocked > 0) process.exit(1)
  console.log(`SENSITIVE_SCAN_CLEAR:${mode}:${files.length}`)
} catch {
  console.error('SENSITIVE_SCAN_FAILED')
  process.exit(1)
}
