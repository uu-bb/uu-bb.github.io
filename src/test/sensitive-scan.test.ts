import { describe, expect, it } from 'vitest'
// @ts-expect-error JavaScript module is shared with the build scripts.
import { isForbiddenPublicFileName, scanPublicValue } from '../../scripts/content-schema.mjs'

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

  it('blocks portfolio audit markers from public release surfaces', () => {
    const samples = [
      ['private', 'only'].join('_'),
      ['release', 'candidate', 'assets'].join('-'),
      ['xwechat', 'files'].join('_'),
      ['Mas', 'ter'].join(''),
    ]
    const rules = samples.flatMap((sample) =>
      scanPublicValue(sample).map((item: { rule: string }) => item.rule),
    )

    expect(rules).toEqual(expect.arrayContaining([
      ['PRIVATE', 'ONLY'].join('_'),
      'RELEASE_CANDIDATE_ASSETS',
      ['XWECHAT', 'FILES'].join('_'),
      'MASTER_LABEL',
    ]))
  })

  it('blocks common credential formats without storing real credentials', () => {
    const samples = [
      ['sk', 'proj', 'abcdefghijklmnopqrstuvwxyz123456'].join('-'),
      ['AKIA', '1234567890ABCDEF'].join(''),
      ['api_key', '=', '"', 'example-secret-value', '"'].join(''),
      ['-----BEGIN ', 'PRIVATE KEY-----'].join(''),
    ]
    const rules = samples.flatMap((sample) =>
      scanPublicValue(sample).map((item: { rule: string }) => item.rule),
    )

    expect(rules).toEqual(
      expect.arrayContaining([
        'OPENAI_TOKEN',
        'AWS_ACCESS_KEY',
        'GENERIC_SECRET_ASSIGNMENT',
        'PRIVATE_KEY',
      ]),
    )
  })

  it('blocks credential files while allowing explicit templates', () => {
    expect(isForbiddenPublicFileName(['.', 'env'].join(''))).toBe(true)
    expect(isForbiddenPublicFileName(['.', 'env', '.', 'example'].join(''))).toBe(false)
    expect(isForbiddenPublicFileName(['server', '.', 'pem'].join(''))).toBe(true)
  })
})
