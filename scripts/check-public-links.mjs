import { access, readFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const content = JSON.parse(
  await readFile(resolve('src/data/public-content.generated.json'), 'utf8'),
)

const urls = new Set([content.profile.github])
for (const item of [...content.projects, ...content.experiments]) {
  if (item.github) urls.add(item.github)
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailPattern.test(content.profile.email)) {
  console.error('PUBLIC_LINK_CHECK_FAILED:EMAIL')
  process.exit(1)
}

try {
  await access(resolve('public/resume/yang-haobo-ai-product-application.pdf'))
} catch {
  console.error('PUBLIC_LINK_CHECK_FAILED:RESUME')
  process.exit(1)
}

const githubOwner = new URL(content.profile.github).pathname.split('/').filter(Boolean)[0]
let verifiedGithubOwner = false
let failures = 0

for (const url of urls) {
  const parsed = new URL(url)
  const pathParts = parsed.pathname.split('/').filter(Boolean)
  const isGithubRepo = parsed.hostname === 'github.com' && pathParts.length === 2

  if (url === content.profile.github) continue

  let verified = false
  if (isGithubRepo) {
    try {
      const { stdout } = await execFileAsync(
        'git',
        ['ls-remote', `${url}.git`, 'HEAD'],
        { timeout: 12_000, windowsHide: true },
      )
      verified = stdout.trim().length > 0
      if (verified && pathParts[0] === githubOwner) verifiedGithubOwner = true
    } catch {
      verified = false
    }
  } else {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(12_000),
      })
      verified = response.ok
    } catch {
      verified = false
    }
  }

  if (verified) {
    console.log(`PUBLIC_LINK_OK:${url}`)
  } else {
    failures += 1
    console.error(`PUBLIC_LINK_CHECK_FAILED:${url}`)
  }
}

if (verifiedGithubOwner) console.log(`PUBLIC_LINK_OK:${content.profile.github}`)
else {
  failures += 1
  console.error(`PUBLIC_LINK_CHECK_FAILED:${content.profile.github}`)
}

if (failures > 0) process.exit(1)
console.log(`PUBLIC_LINK_CHECK_PASS:${urls.size + 2}`)
