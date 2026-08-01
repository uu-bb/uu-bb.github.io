import { describe, expect, it } from 'vitest'
// @ts-expect-error JavaScript module is shared with the build scripts.
import { scanPublicValue } from '../../scripts/content-schema.mjs'

describe('sensitive information scanner', () => {
  it('blocks constructed path, mobile and internal-field samples', () => {
    const sample = {
      localPath: ['D', ':', '/', 'private', '/', 'record'].join(''),
      contact: ['132', '0376', '8801'].join(''),
    }
    const rules = scanPublicValue(sample).map((item: { rule: string }) => item.rule)

    expect(rules).toContain('FORBIDDEN_FIELD')
    expect(rules).toContain('ABSOLUTE_PATH')
    expect(rules).toContain('MOBILE_NUMBER')
  })

  it('does not mistake a decimal constant for a mobile number', () => {
    const findings = scanPublicValue('3.14159265359')
    expect(findings).toEqual([])
  })
})
