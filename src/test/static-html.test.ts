import { describe, expect, it } from 'vitest'
import publicContent from '../data/public-content.generated.json'
// @ts-expect-error The build-time renderer is a shared JavaScript module.
import { renderStaticPortfolio, renderStructuredData } from '../../scripts/static-portfolio.mjs'

describe('static portfolio HTML', () => {
  it('renders recruiter-critical content from the public fact source', () => {
    const html = renderStaticPortfolio(publicContent)

    for (const text of [
      '杨皓博',
      'AI 产品 × AI 应用工程',
      '2027 届本科 · 深圳',
      'AI 产品设计',
      'Agent 工作流',
      'RAG 知识系统',
      'FastAPI 后端服务',
      '深圳 AI 求职助手',
      '小u鱼',
      'RAG 智能知识库',
      '32/32 项测试通过',
      '29/29 项 v1 交付基线测试通过',
      '7/7 项 Lite 与元数据链路测试通过',
      '查看综合简历',
    ]) {
      expect(html).toContain(text)
    }
  })

  it('builds structured data from verified public fields only', () => {
    const json = renderStructuredData(publicContent)
    const data = JSON.parse(json) as { '@graph': Array<Record<string, unknown>> }

    expect(data['@graph']).toEqual(expect.arrayContaining([
      expect.objectContaining({ '@type': 'Person', name: '杨皓博' }),
      expect.objectContaining({ '@type': 'WebSite' }),
      expect.objectContaining({ '@type': 'ItemList' }),
    ]))
    expect(json).not.toMatch(/1[3-9]\d{9}/)
    expect(json).not.toMatch(/(?:^|["'\s])[A-Za-z]:[\\/]/)
  })
})
