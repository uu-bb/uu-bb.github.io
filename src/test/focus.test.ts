import { describe, expect, it } from 'vitest'
import { getProjectOrder, isRoleLens, parseRoleLens } from '../utils/focus'

describe('role lens routing', () => {
  it('accepts only supported focus values', () => {
    expect(parseRoleLens('presales')).toBe('presales')
    expect(parseRoleLens('support')).toBe('support')
    expect(parseRoleLens('ai-app')).toBe('ai-app')
    expect(parseRoleLens('unexpected')).toBe('overview')
    expect(parseRoleLens(null)).toBe('overview')
    expect(isRoleLens('overview')).toBe(true)
    expect(isRoleLens('unexpected')).toBe(false)
  })

  it('returns the agreed three-project order for each lens', () => {
    expect(getProjectOrder('overview')).toEqual([
      'job-assistant',
      'careerpilot',
      'rag-knowledge-base',
    ])
    expect(getProjectOrder('presales')[0]).toBe('careerpilot')
    expect(getProjectOrder('support')[0]).toBe('rag-knowledge-base')
    expect(getProjectOrder('ai-app')[2]).toBe('agent-toolkit')
  })
})
