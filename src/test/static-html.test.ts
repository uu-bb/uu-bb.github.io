import { describe, expect, it } from 'vitest'
import publicContent from '../data/public-content.generated.json'
// @ts-expect-error The build-time renderer is a shared JavaScript module.
import { renderStaticPortfolio, renderStructuredData } from '../../scripts/static-portfolio.mjs'

describe('static portfolio HTML', () => {
  it('renders recruiter-critical content from the public fact source', () => {
    const html = renderStaticPortfolio(publicContent)

    for (const text of [
      '杨皓博',
      'AI 解决方案 × 售前技术支持',
      '2027 届本科 · 深圳',
      '需求分析与方案设计',
      '客户沟通与问题闭环',
      'AI 应用交付（RAG · Agent）',
      'Python 与 FastAPI 工程',
      '实习经历',
      '蓝色光标-思恩客',
      '深圳猞猁保科技有限公司',
      '教育背景',
      '电子科技大学中山学院',
      '深圳 AI 求职助手',
      'CareerPilot',
      'RAG 智能知识库',
      '查看简历',
    ]) {
      expect(html).toContain(text)
    }
  })

  it('keeps the static fallback free of test counts and retired projects', () => {
    const html = renderStaticPortfolio(publicContent)

    for (const text of [
      '32/32',
      '436/436',
      '7/7',
      '10 项专项测试',
      '小u鱼',
      'AI 产品与应用工程',
    ]) {
      expect(html).not.toContain(text)
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
