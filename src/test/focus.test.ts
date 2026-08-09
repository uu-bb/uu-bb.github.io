import { describe, expect, it } from 'vitest'
import { getProjectOrder, isRoleLens, parseRoleLens } from '../utils/focus'

const roleLenses = ['overview', 'product', 'ai-app', 'python'] as const
const rejectedFocusValues = [
  '',
  'unexpected',
  ['private', 'only'].join('_'),
  ['release', 'candidate', 'assets'].join('-'),
  ['436', '436'].join('/'),
  ['D', ':', '\\', 'internal'].join(''),
]

describe('role lens routing', () => {
  it.each(roleLenses)('accepts the supported focus value %s', (value) => {
    expect(isRoleLens(value)).toBe(true)
    expect(parseRoleLens(value)).toBe(value)
  })

  it.each(rejectedFocusValues)('rejects the non-lens URL value %s', (value) => {
    expect(isRoleLens(value)).toBe(false)
    expect(parseRoleLens(value)).toBe('overview')
  })

  it('falls back to overview for an absent focus value', () => {
    expect(isRoleLens(null)).toBe(false)
    expect(parseRoleLens(null)).toBe('overview')
  })

  it.each(['slumber', 'wake'])('keeps the Hero state %s outside RoleLens', (value) => {
    expect(isRoleLens(value)).toBe(false)
    expect(parseRoleLens(value)).toBe('overview')
  })

  it('returns the agreed three-project order for each lens', () => {
    expect(getProjectOrder('overview')).toEqual([
      'job-assistant',
      'xiaoyu',
      'rag-knowledge-base',
    ])
    expect(getProjectOrder('product')[0]).toBe('xiaoyu')
    expect(getProjectOrder('ai-app')[2]).toBe('agent-toolkit')
    expect(getProjectOrder('python')[2]).toBe('agent-toolkit')
  })
})
