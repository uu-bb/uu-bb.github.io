import { execFileSync } from 'node:child_process'
import { extname } from 'node:path'
import { isForbiddenPublicFileName, scanPublicValue } from './content-schema.mjs'

const textExtensions = new Set([
  '.css', '.html', '.js', '.json', '.jsx', '.mjs', '.md', '.map', '.ts', '.tsx',
  '.txt', '.xml', '.yml', '.yaml',
])

function git(args) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

let blocked = 0
try {
  const commits = git(['rev-list', '--all']).trim().split(/\r?\n/).filter(Boolean)
  for (const commit of commits) {
    const messageFindings = scanPublicValue(git(['show', '-s', '--format=%B', commit]))
    if (messageFindings.length > 0) {
      const rules = [...new Set(messageFindings.map((item) => item.rule))].sort()
      blocked += messageFindings.length
      console.error(`HISTORY_SCAN_BLOCKED:${commit.slice(0, 12)}:COMMIT:${rules.join(',')}`)
    }

    const files = git(['ls-tree', '-r', '--name-only', commit])
      .trim()
      .split(/\r?\n/)
      .filter(
        (file) =>
          textExtensions.has(extname(file).toLowerCase()) ||
          isForbiddenPublicFileName(file),
      )

    for (const file of files) {
      if (isForbiddenPublicFileName(file)) {
        blocked += 1
        console.error(
          `HISTORY_SCAN_BLOCKED:${commit.slice(0, 12)}:${file}:FORBIDDEN_FILE`,
        )
        continue
      }
      const findings = scanPublicValue(git(['show', `${commit}:${file}`]))
      if (findings.length > 0) {
        const rules = [...new Set(findings.map((item) => item.rule))].sort()
        blocked += findings.length
        console.error(
          `HISTORY_SCAN_BLOCKED:${commit.slice(0, 12)}:${file}:${rules.join(',')}`,
        )
      }
    }
  }

  if (blocked > 0) process.exit(1)
  console.log(`HISTORY_SCAN_CLEAR:${commits.length}`)
} catch {
  console.error('HISTORY_SCAN_FAILED')
  process.exit(1)
}
