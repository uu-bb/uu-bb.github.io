import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('portfolio experience', () => {
  it('shows recruiter-critical information without interaction', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByText('SLEEPY LAB / 睡醒实验室')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '杨皓博' })).toBeInTheDocument()
    expect(screen.getByText('AI 解决方案 × 售前技术支持')).toBeInTheDocument()
    expect(screen.getByText(/可交付、可验证的方案/)).toBeInTheDocument()
    expect(screen.getByText(/2027 届本科 · 深圳/)).toBeInTheDocument()
    expect(screen.getByText(/求职 AI 解决方案 \/ 售前技术支持（秋招正式岗）/)).toBeInTheDocument()
    expect(screen.getAllByText(/可尽快到岗 · 支持出差/).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: '查看核心项目' })).toHaveAttribute(
      'href',
      '#job-assistant',
    )
    expect(screen.getByRole('link', { name: '查看简历' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '联系我' })).toHaveAttribute('href', '#contact')
    expect(screen.getByRole('link', { name: '下载 PDF' })).toBeInTheDocument()
  })

  it('shows the internship and education records on the homepage', () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    const experience = document.querySelector('#experience')
    expect(experience).not.toBeNull()
    expect(experience).toHaveTextContent('蓝色光标-思恩客')
    expect(experience).toHaveTextContent('AI 开发实习生')
    expect(experience).toHaveTextContent('深圳猞猁保科技有限公司')
    expect(experience).toHaveTextContent('售前技术支持')
    expect(experience).toHaveTextContent('2026.04 – 至今')
    expect(experience).toHaveTextContent('2026.01 – 2026.04')
    expect(experience).toHaveTextContent('电子科技大学中山学院')
    expect(experience).toHaveTextContent('人工智能')
    expect(document.body.textContent).not.toContain('小u鱼')
  })

  it('renders a recruiter-readable overview from published outcome records', () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    const evidenceRegion = screen.getByRole('region', { name: '核心项目证据' })
    expect(
      within(evidenceRegion).getByText('岗位发现 → JD 解析 → 证据匹配 → 人工确认，四段链路可完整走通'),
    ).toBeInTheDocument()
    expect(
      within(evidenceRegion).getByText(
        '职业画像逐项确认 → 知识库匹配 → 规则推荐 → 能力差距分析，四段流程可完整演示',
      ),
    ).toBeInTheDocument()
    expect(
      within(evidenceRegion).getByText('Lite 查询 → 来源引用 → 无匹配降级，三段结果均可复现'),
    ).toBeInTheDocument()
    expect(within(evidenceRegion).getAllByText('最近核验：2026-08-01')).toHaveLength(2)
    expect(within(evidenceRegion).getByRole('link', {
      name: '查看CareerPilot AI 职业探索与成长规划助手',
    })).toHaveAttribute('href', '#careerpilot')
  })

  it('keeps test counts out of the published evidence region', () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    const evidenceRegion = screen.getByRole('region', { name: '核心项目证据' })
    for (const retired of ['32/32', '436/436', '7/7', '10 项专项测试', 'pytest', 'unittest']) {
      expect(evidenceRegion.textContent).not.toContain(retired)
    }
  })

  it('puts direct recruiter contact before optional topic interaction', () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    const directContact = screen.getByRole('group', { name: '直接联系方式' })
    const optionalTopics = screen.getByRole('region', { name: '可选联系话题' })

    expect(
      within(directContact).getByText('正在寻找 AI 解决方案 / 售前技术支持岗位'),
    ).toBeInTheDocument()
    expect(within(directContact).getByRole('link', { name: '发送邮件' })).toBeInTheDocument()
    expect(within(directContact).getByRole('button', { name: '复制邮箱' })).toBeInTheDocument()
    expect(within(directContact).getByRole('link', { name: '查看简历' })).toBeInTheDocument()
    expect(within(directContact).getByRole('link', { name: 'GitHub' })).toBeInTheDocument()
    expect(
      directContact.compareDocumentPosition(optionalTopics) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('switches the project lens while keeping three independent case links', () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    const switcher = document.querySelector('.lens-switcher') as HTMLElement
    const presalesLens = within(switcher).getByRole('button', { name: /售前与方案/ })
    expect(presalesLens).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(presalesLens)

    expect(presalesLens).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', {
      name: '先听懂客户在担心什么，再把能力翻译成他能验收的方案。',
    })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Customer Discovery' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Requirement Framing' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '阅读案例 ↗' })).toHaveLength(3)
    expect(screen.getAllByRole('link', { name: '阅读案例 ↗' })[0]).toHaveAttribute(
      'href',
      '/?project=careerpilot&focus=presales#careerpilot',
    )
    expect(document.querySelector('.lens-current-state')).toHaveTextContent(
      '当前视角：售前与方案优先阅读需求梳理、方案表达、演示准备与沟通口径。',
    )
    const lensDescriptions = [document.querySelector('.lens-current-state')?.textContent]
    for (const lensLabel of ['综合', '技术支持与交付', 'AI 应用']) {
      fireEvent.click(within(switcher).getByRole('button', { name: new RegExp(lensLabel) }))
      lensDescriptions.push(document.querySelector('.lens-current-state')?.textContent)
    }
    expect(new Set(lensDescriptions).size).toBe(4)
    expect(screen.getByLabelText(/SLUMBER WAKE LAB/)).toBeInTheDocument()
  })

  it('orders the homepage cases by the active lens', () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    expect(screen.getAllByRole('link', { name: '阅读案例 ↗' })[0]).toHaveAttribute(
      'href',
      '/?project=job-assistant&focus=overview#job-assistant',
    )

    fireEvent.click(
      within(document.querySelector('.lens-switcher') as HTMLElement)
        .getByRole('button', { name: /技术支持与交付/ }),
    )
    expect(screen.getAllByRole('link', { name: '阅读案例 ↗' })[0]).toHaveAttribute(
      'href',
      '/?project=rag-knowledge-base&focus=support#rag-knowledge-base',
    )
  })

  it('routes 3D capabilities to verified projects', () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    const ragGuide = screen.getByRole('button', { name: /RAG 系统/ })
    fireEvent.click(ragGuide)

    expect(ragGuide).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', {
      level: 4,
      name: 'RAG 智能知识库问答系统',
    })).toBeInTheDocument()
    expect(screen.getAllByText('检索到来源引用全链路可演示').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: '进入项目讲解 ↗' })).toHaveAttribute(
      'href',
      '/?project=rag-knowledge-base&focus=ai-app',
    )
  })

  it('changes the contact message with keyboard input', () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    const wheel = screen.getByRole('listbox', { name: '选择联系目的' })
    fireEvent.keyDown(wheel, { key: 'ArrowDown' })

    expect(screen.getByRole('option', { name: '项目合作' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('heading', { name: '把一个还模糊的想法聊清楚。' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '以“项目合作”为主题写信 ↗' })).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent('项目合作｜来自 Slumber Wake Lab')),
    )
  })

  it('turns a project route into a complete interview-ready walkthrough', async () => {
    window.history.pushState({}, '', '/?focus=ai-app#job-assistant')
    render(<App />)

    expect(screen.getByRole('navigation', { name: '项目讲解目录' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '谁会使用它，发生在什么场景？' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '用户怎样完成一次任务？' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '系统怎样分工？' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '读一段真正影响边界的代码。' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '这段代码实现了什么？' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '哪些是我亲手完成的？' })).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: '先看懂，再看细节。' }, { timeout: 10000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '项目理解' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '面向对象' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '关键取舍与边界' })).toBeInTheDocument()

    const contribution = document.querySelector('#contribution')
    const flow = document.querySelector('#flow')
    const architecture = document.querySelector('#architecture')
    expect(contribution).not.toBeNull()
    if (!contribution || !flow || !architecture) throw new Error('项目详情章节缺失')
    expect(contribution.compareDocumentPosition(flow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(
      contribution.compareDocumentPosition(architecture) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(await screen.findByRole('heading', { level: 1, name: '深圳 AI 求职助手' })).toHaveFocus()
  })

  it('renders approved job evidence only on the project page and in frozen order', () => {
    window.history.pushState({}, '', '/?project=job-assistant&focus=ai-app')
    render(<App />)

    const region = screen.getByRole('region', { name: '真实运行证据' })
    const figures = [...region.querySelectorAll('figure')]
    expect(figures.map((figure) => figure.dataset.evidenceId)).toEqual([
      'ja-analysis',
      'ja-preview-confirmation',
      'ja-validation-guard',
    ])
    for (const image of region.querySelectorAll('img')) {
      expect(image).toHaveAttribute('loading', 'lazy')
      expect(image).toHaveAttribute('decoding', 'async')
      expect(image).toHaveAttribute('width')
      expect(image).toHaveAttribute('height')
    }
    const originalLinks = within(region).getAllByRole('link', { name: /查看“.+”原图/ })
    expect(originalLinks).toHaveLength(3)
    for (const link of originalLinks) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link.getAttribute('href')).toMatch(/^\/evidence\/job-assistant\/.+\.png$/)
    }
  })

  it('keeps RAG media order while adding approved distinguishing labels', () => {
    window.history.pushState({}, '', '/?project=rag-knowledge-base&focus=ai-app')
    render(<App />)

    const region = screen.getByRole('region', { name: '真实运行证据' })
    expect(within(region).getAllByText(/证据 0[1-3] ·/).map((item) => item.textContent)).toEqual([
      '证据 01 · 查询与来源',
      '证据 02 · 无匹配降级',
      '证据 03 · 索引状态',
    ])
    expect([...region.querySelectorAll('figure')].map((figure) => figure.dataset.evidenceId)).toEqual([
      'rag-query-with-sources',
      'rag-no-match-fallback',
      'rag-knowledge-status',
    ])
  })

  it('renders the careerpilot case without a public media gallery', () => {
    window.history.pushState({}, '', '/?project=careerpilot&focus=presales')
    render(<App />)

    expect(screen.getByRole('heading', {
      level: 1,
      name: 'CareerPilot AI 职业探索与成长规划助手',
    })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '公开证据' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '真实运行证据' })).not.toBeInTheDocument()
    expect(document.querySelector('.case-artwork')).toBeNull()
    expect(screen.getByText('先确认证据，再给出差距')).toBeInTheDocument()
  })

  it('does not render evidence images on the portfolio homepage', () => {
    window.history.pushState({}, '', '/')
    const { container } = render(<App />)
    expect(container.querySelector('img[src*="/evidence/"]')).not.toBeInTheDocument()
  })
})
