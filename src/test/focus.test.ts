import { describe, expect, it } from 'vitest'
import { getProjectOrder, parseRoleLens } from '../utils/focus'

describe('role lens routing', () => {
  it('accepts only supported focus values', () => {
    expect(parseRoleLens('product')).toBe('product')
    expect(parseRoleLens('ai-app')).toBe('ai-app')
    expect(parseRoleLens('python')).toBe('python')
    expect(parseRoleLens('unexpected')).toBe('overview')
    expect(parseRoleLens(null)).toBe('overview')
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
