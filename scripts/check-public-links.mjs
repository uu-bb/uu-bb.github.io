import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

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

let failures = 0
for (const url of urls) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(12_000),
    })
    if (!response.ok) {
      failures += 1
      console.error(`PUBLIC_LINK_CHECK_FAILED:HTTP_${response.status}:${url}`)
    } else {
      console.log(`PUBLIC_LINK_OK:${response.status}:${url}`)
    }
  } catch {
    failures += 1
    console.error(`PUBLIC_LINK_CHECK_FAILED:NETWORK:${url}`)
  }
}

if (failures > 0) process.exit(1)
console.log(`PUBLIC_LINK_CHECK_PASS:${urls.size + 2}`)
