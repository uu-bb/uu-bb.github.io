import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterAll, describe, expect, it, vi } from 'vitest'
import App from '../App'

afterAll(async () => {
  await import('../components/ProjectBento')
})

describe('portfolio experience', () => {
  it('keeps the homepage document title aligned with the public portfolio title', () => {
    window.history.replaceState({}, '', '/')
    document.title = 'stale project title'

    render(<App />)

    expect(document.title).toBe('杨皓博｜AI 产品与应用工程作品集 · 睡醒实验室')
  })

  it.each([
    {
      projectId: 'job-assistant',
      heading: '深圳 AI 求职助手',
      documentTitle: '深圳 AI 求职助手｜Slumber Wake Lab',
    },
    {
      projectId: 'rag-knowledge-base',
      heading: 'RAG 智能知识库问答系统',
      documentTitle: 'RAG 智能知识库问答系统｜Slumber Wake Lab',
    },
    {
      projectId: 'xiaoyu',
      heading: '小u鱼｜本地双角色长期陪伴系统',
      documentTitle: '小u鱼｜本地双角色长期陪伴系统｜Slumber Wake Lab',
    },
  ])('keeps the $projectId document title aligned with its public title', ({
    projectId,
    heading,
    documentTitle,
  }) => {
    window.history.replaceState({}, '', `/?project=${projectId}&focus=overview`)
    document.title = '杨皓博｜AI 产品与应用工程作品集 · 睡醒实验室'

    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(document.title).toBe(documentTitle)
    expect(document.title).not.toContain('Windows 智能桌宠')
    expect(document.title).not.toMatch(/(?:29|436)\/\d+/)
    window.history.replaceState({}, '', '/')
  })

  it('shows recruiter-critical information without interaction', () => {
    render(<App />)
    expect(screen.getByText('SLEEPY LAB / 睡醒实验室')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '杨皓博' })).toBeInTheDocument()
    expect(screen.getByText('AI 产品 × AI 应用工程')).toBeInTheDocument()
    expect(screen.getByText(/可控、可验证、能交付的 AI 产品/)).toBeInTheDocument()
    expect(screen.getByText(/2027 届本科 · 深圳/)).toBeInTheDocument()
    expect(screen.getByText(/可尽快到岗 · 每周 5 天 · 可持续 3 个月以上/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '查看核心项目' })).toHaveAttribute(
      'href',
      '#job-assistant',
    )
    expect(screen.getByRole('link', { name: '查看综合简历' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '联系我' })).toHaveAttribute('href', '#contact')
    expect(screen.getByRole('link', { name: '下载 PDF' })).toBeInTheDocument()
  })

  it('starts in slumber and toggles the lab without changing navigation or project facts', () => {
    window.history.replaceState({}, '', '/')
    const initialUrl = window.location.href
    const initialHistoryLength = window.history.length
    const { container } = render(<App />)
    const hero = container.querySelector<HTMLElement>('.hero-stage')
    const heroRegion = within(hero as HTMLElement)
    const labToggle = heroRegion.getByRole('button', { name: '唤醒睡醒实验室' })
    const announcement = container.querySelector('.hero-lab-announcement')

    expect(hero).toHaveAttribute('data-lab-state', 'slumber')
    expect(hero).toHaveClass('is-slumber')
    expect(heroRegion.getByRole('heading', { level: 1, name: '杨皓博' })).toBeVisible()
    expect(heroRegion.getByText('AI 产品 × AI 应用工程')).toBeVisible()
    expect(heroRegion.getByText('STATUS / SLUMBER')).toBeInTheDocument()
    expect(heroRegion.getByText('实验室待机中')).toBeInTheDocument()
    expect(labToggle).toHaveAttribute('aria-pressed', 'false')
    expect(labToggle).toHaveTextContent('唤醒实验室')
    expect(container.querySelector('.hero-stage__media--wake')).not.toBeInTheDocument()

    fireEvent.click(labToggle)

    expect(hero).toHaveAttribute('data-lab-state', 'wake')
    expect(hero).toHaveClass('is-wake')
    expect(container.querySelector('.hero-stage__media--wake')).toBeInTheDocument()
    expect(labToggle).toHaveAttribute('aria-pressed', 'true')
    expect(labToggle).toHaveAccessibleName('让睡醒实验室进入待机状态')
    expect(labToggle).toHaveTextContent('让实验室入睡')
    expect(heroRegion.getByText('STATUS / WAKE')).toBeInTheDocument()
    expect(heroRegion.getByText('实验室已开启')).toBeInTheDocument()
    expect(announcement).toHaveAttribute('aria-live', 'polite')
    expect(announcement).toHaveTextContent('睡醒实验室已开启')
    expect(window.location.href).toBe(initialUrl)
    expect(window.history.length).toBe(initialHistoryLength)

    fireEvent.click(labToggle)

    expect(hero).toHaveAttribute('data-lab-state', 'slumber')
    expect(labToggle).toHaveAttribute('aria-pressed', 'false')
    expect(labToggle).toHaveAccessibleName('唤醒睡醒实验室')
    expect(announcement).toHaveTextContent('睡醒实验室已进入待机状态')
    expect(screen.getByText('436/436 项当前 V3 自动化测试通过')).toBeInTheDocument()
    expect(screen.getByText(
      '扩展实验：LightRAG。完成 4 项编排流程测试，验证基础调用与流程连接；真实 Ollama 检索和回答效果仍待验证。',
    )).toBeInTheDocument()
    expect(window.location.href).toBe(initialUrl)
    expect(window.history.length).toBe(initialHistoryLength)
  })

  it('renders a recruiter-readable evidence overview from Evidence records', () => {
    render(<App />)

    const evidenceRegion = screen.getByRole('region', { name: '核心项目证据' })
    expect(within(evidenceRegion).getByText('32/32 项测试通过')).toBeInTheDocument()
    expect(within(evidenceRegion).getByText('436/436 项当前 V3 自动化测试通过')).toBeInTheDocument()
    expect(within(evidenceRegion).getByText('7/7 项 Lite 与元数据链路测试通过')).toBeInTheDocument()
    expect(within(evidenceRegion).getAllByText('最近核验：2026-08-01')).toHaveLength(2)
    expect(within(evidenceRegion).getByText('最近核验：2026-08-05')).toBeInTheDocument()
    expect(within(evidenceRegion).getByRole('link', {
      name: '查看深圳 AI 求职助手',
    })).toHaveAttribute('href', '#job-assistant')
  })

  it('puts direct recruiter contact before optional topic interaction', () => {
    render(<App />)

    const directContact = screen.getByRole('group', { name: '直接联系方式' })
    const optionalTopics = screen.getByRole('region', { name: '可选联系话题' })

    expect(within(directContact).getByText('正在寻找 AI 产品 / AI 应用工程实习')).toBeInTheDocument()
    expect(within(directContact).getByRole('link', { name: '发送邮件' })).toBeInTheDocument()
    expect(within(directContact).getByRole('button', { name: '复制邮箱' })).toBeInTheDocument()
    expect(within(directContact).getByRole('link', { name: '查看简历' })).toBeInTheDocument()
    expect(within(directContact).getByRole('link', { name: 'GitHub' })).toBeInTheDocument()
    expect(
      directContact.compareDocumentPosition(optionalTopics) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('switches the project lens while keeping three independent case links', () => {
    render(<App />)

    const productLens = screen.getByRole('button', { name: /AI 产品/ })
    const initialLensStatus = screen.getByRole('status', { name: '当前求职视角' })
    expect(initialLensStatus).toHaveClass('lens-current-state')
    expect(initialLensStatus).toHaveTextContent('当前视角：综合')
    expect(productLens).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(productLens)

    expect(productLens).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status', { name: '当前求职视角' }))
      .toHaveTextContent('当前视角：AI 产品')
    expect(screen.getByRole('heading', {
      name: '先把用户、场景和边界讲清楚，再决定 AI 应该出现在哪里。',
    })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Problem Framing' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'RAG Systems' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '阅读案例 ↗' })).toHaveLength(3)
    expect(screen.getAllByRole('link', { name: '阅读案例 ↗' })[0]).toHaveAttribute(
      'href',
      '/?project=xiaoyu&focus=product#xiaoyu',
    )
    expect(screen.getByLabelText(/SLUMBER WAKE LAB/)).toBeInTheDocument()
  })

  it('gives every overview project card a stable focus plus hash href', () => {
    window.history.replaceState({}, '', '/')
    render(<App />)

    expect(screen.getAllByRole('link', { name: '阅读案例 ↗' }).map((link) => ({
      projectId: link.getAttribute('data-project-link'),
      href: link.getAttribute('href'),
    }))).toEqual([
      {
        projectId: 'job-assistant',
        href: '/?project=job-assistant&focus=overview#job-assistant',
      },
      { projectId: 'xiaoyu', href: '/?project=xiaoyu&focus=overview#xiaoyu' },
      {
        projectId: 'rag-knowledge-base',
        href: '/?project=rag-knowledge-base&focus=overview#rag-knowledge-base',
      },
    ])
  })

  it('routes 3D capabilities to verified projects', () => {
    render(<App />)

    const ragGuide = screen.getByRole('button', { name: /RAG 系统/ })
    fireEvent.click(ragGuide)

    expect(ragGuide).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', {
      level: 4,
      name: 'RAG 智能知识库问答系统',
    })).toBeInTheDocument()
    expect(screen.getByText('7 项测试通过 · unittest')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '进入项目讲解 ↗' })).toHaveAttribute(
      'href',
      '/?project=rag-knowledge-base&focus=ai-app#rag-knowledge-base',
    )
  })

  it('changes the contact message with keyboard input', () => {
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
    window.history.pushState({}, '', '/?project=job-assistant&focus=ai-app')
    render(<App />)
    await vi.dynamicImportSettled()

    expect(screen.getByRole('navigation', { name: '项目讲解目录' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '谁会使用它，发生在什么场景？' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '用户怎样完成一次任务？' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '系统怎样分工？' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '读一段真正影响边界的代码。' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '这段代码实现了什么？' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '哪些是我亲手完成的？' })).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: '先看懂，再看细节。' }, { timeout: 3000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '项目理解' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '面向对象' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '关键取舍与边界' })).toBeInTheDocument()
  })

  it.each([
    ['/?focus=overview#job-assistant', '深圳 AI 求职助手'],
    ['/?focus=ai-app#job-assistant', '深圳 AI 求职助手'],
    ['/?focus=product#xiaoyu', '小u鱼｜本地双角色长期陪伴系统'],
    ['/?focus=python#agent-toolkit', 'Agent Service Toolkit 岗位匹配 Agent'],
  ])('opens the copied project deep link %s on first render', (href, projectTitle) => {
    window.history.replaceState({}, '', href)
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: projectTitle })).toBeInTheDocument()
  })

  it('ignores invalid project hashes and keeps plain homepage anchors on the portfolio', () => {
    for (const href of ['/?focus=product#not-a-project', '/#job-assistant']) {
      window.history.replaceState({}, '', href)
      const view = render(<App />)

      expect(screen.getByRole('heading', { level: 1, name: '杨皓博' })).toBeInTheDocument()
      view.unmount()
    }
  })

  it('keeps project identity in chapter links when the detail opened from a hash', () => {
    window.history.replaceState({}, '', '/?focus=ai-app#job-assistant')
    render(<App />)

    expect(within(screen.getByRole('navigation', { name: '项目讲解目录' }))
      .getByRole('link', { name: '02 贡献' }))
      .toHaveAttribute('href', '/?project=job-assistant&focus=ai-app#contribution')
  })

  it('normalizes an invalid focus with replaceState while Hero stays slumber', async () => {
    window.history.replaceState({ sentinel: 'kept' }, '', '/?focus=wake#focus')
    const initialHistoryLength = window.history.length

    render(<App />)

    await waitFor(() => expect(window.location.search).toBe('?focus=overview'))
    expect(window.location.hash).toBe('#focus')
    expect(window.history.length).toBe(initialHistoryLength)
    expect(window.history.state).toEqual({ sentinel: 'kept' })
    expect(screen.getByRole('button', { name: /综合/ })).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('.hero-stage')).toHaveAttribute('data-lab-state', 'slumber')
    expect(window.history.state).not.toHaveProperty('heroState')
    expect(window.history.state).not.toHaveProperty('labState')
  })

  it('pushes only distinct focus URLs and restores the lens on popstate', async () => {
    window.history.replaceState({}, '', '/?focus=overview#focus')
    const initialHistoryLength = window.history.length
    render(<App />)

    const productLens = screen.getByRole('button', { name: /AI 产品/ })
    fireEvent.click(productLens)
    expect(window.location.search).toBe('?focus=product')
    expect(window.location.hash).toBe('#projects')
    expect(window.history.length).toBe(initialHistoryLength + 1)

    fireEvent.click(productLens)
    expect(window.history.length).toBe(initialHistoryLength + 1)

    window.history.replaceState({}, '', '/?focus=overview#projects')
    act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: {} })))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /综合/ })).toHaveAttribute('aria-pressed', 'true')
    })
    expect(document.querySelector('.hero-stage')).toHaveAttribute('data-lab-state', 'slumber')
  })

  it('syncs project routes on popstate and hashchange while project query stays authoritative', async () => {
    window.history.replaceState({}, '', '/?focus=ai-app#projects')
    render(<App />)

    window.history.pushState({}, '', '/?project=job-assistant&focus=ai-app#xiaoyu')
    act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: {} })))

    const jobHeading = await screen.findByRole('heading', {
      level: 1,
      name: '深圳 AI 求职助手',
    })
    await waitFor(() => expect(jobHeading).toHaveFocus())

    window.history.replaceState({}, '', '/?focus=product#xiaoyu')
    act(() => window.dispatchEvent(new HashChangeEvent('hashchange')))

    const xiaoyuHeading = await screen.findByRole('heading', {
      level: 1,
      name: '小u鱼｜本地双角色长期陪伴系统',
    })
    await waitFor(() => expect(xiaoyuHeading).toHaveFocus())

    window.history.replaceState({}, '', '/?focus=product#projects')
    act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: {} })))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /AI 产品/ })).toHaveAttribute('aria-pressed', 'true')
    })
    expect(document.querySelector('.hero-stage')).toHaveAttribute('data-lab-state', 'slumber')
  })

  it('closes a detail through history state and restores the original project link focus', async () => {
    window.history.replaceState({}, '', '/?project=job-assistant&focus=ai-app#job-assistant')
    const initialHistoryLength = window.history.length
    render(<App />)

    const detailHeading = screen.getByRole('heading', { level: 1, name: '深圳 AI 求职助手' })
    await waitFor(() => expect(detailHeading).toHaveFocus())

    fireEvent.click(screen.getByRole('link', { name: '← 返回作品集' }))

    await waitFor(() => {
      expect(window.location.search).toBe('?focus=ai-app')
      expect(window.location.hash).toBe('#projects')
    })
    expect(window.history.length).toBe(initialHistoryLength + 1)
    expect(window.history.state).toMatchObject({ portfolioReturnFocus: 'job-assistant' })
    expect(window.history.state).not.toHaveProperty('heroState')
    expect(window.history.state).not.toHaveProperty('labState')
    await waitFor(() => {
      expect(document.querySelector('[data-project-link="job-assistant"]')).toHaveFocus()
    })

    window.history.replaceState({}, '', '/?project=job-assistant&focus=ai-app#job-assistant')
    act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: {} })))
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: '深圳 AI 求职助手' })).toHaveFocus()
    })

    window.history.replaceState(
      { portfolioReturnFocus: 'job-assistant' },
      '',
      '/?focus=ai-app#projects',
    )
    act(() => window.dispatchEvent(new PopStateEvent('popstate', {
      state: { portfolioReturnFocus: 'job-assistant' },
    })))
    await waitFor(() => {
      expect(document.querySelector('[data-project-link="job-assistant"]')).toHaveFocus()
    })
  })

  it('restores focus to the agent-toolkit opener in the lab guide', async () => {
    window.history.replaceState({}, '', '/?project=agent-toolkit&focus=ai-app#agent-toolkit')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('heading', {
        level: 1,
        name: 'Agent Service Toolkit 岗位匹配 Agent',
      })).toHaveFocus()
    })
    fireEvent.click(screen.getByRole('link', { name: '← 返回作品集' }))

    const opener = await screen.findByRole('link', { name: '进入项目讲解 ↗' })
    expect(opener).toHaveAttribute(
      'href',
      '/?project=agent-toolkit&focus=ai-app#agent-toolkit',
    )
    await waitFor(() => expect(opener).toHaveFocus())
  })

  it.each([
    { projectId: 'job-assistant', projectTitle: '深圳 AI 求职助手' },
    { projectId: 'rag-knowledge-base', projectTitle: 'RAG 智能知识库问答系统' },
    { projectId: 'xiaoyu', projectTitle: '小u鱼｜本地双角色长期陪伴系统' },
  ])('orders $projectTitle for recruiter-first reading', ({ projectId, projectTitle }) => {
    window.history.pushState({}, '', `/?project=${projectId}&focus=overview`)
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: projectTitle })).toBeInTheDocument()
    const toc = screen.getByRole('navigation', { name: '项目讲解目录' })
    expect(within(toc).getAllByRole('link').map((link) => link.textContent?.trim())).toEqual([
      '01 理解',
      '02 贡献',
      '03 对象',
      '04 流程',
      '05 架构',
      '06 代码',
      '07 证据',
      '08 取舍',
    ])

    const orderedIds = [
      'understanding',
      'contribution',
      'audience',
      'flow',
      'architecture',
      'code',
      'evidence',
      'decisions',
    ]
    const sections = orderedIds.map((id) => document.querySelector<HTMLElement>(`#${id}`))
    if (sections.some((section) => section === null)) throw new Error('项目详情章节缺失')
    for (let index = 0; index < sections.length - 1; index += 1) {
      expect(
        sections[index]!.compareDocumentPosition(sections[index + 1]!)
          & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }

    const contribution = sections[1]!
    const projectMap = document.querySelector<HTMLElement>('.project-bento')
    if (!projectMap) throw new Error('项目讲解地图缺失')
    expect(
      contribution.compareDocumentPosition(projectMap) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(within(contribution).getByRole('heading', { name: '哪些是我亲手完成的？' }))
      .toBeInTheDocument()
    expect(sections[6]).toHaveAttribute('id', 'evidence')
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
    const originalLinks = within(region).getAllByRole('link', { name: /查看“.+”原图/ })
    expect(originalLinks).toHaveLength(3)
    for (const link of originalLinks) {
      expect(link.getAttribute('href')).toMatch(/^\/evidence\/rag\/.+\.png$/)
    }
  })

  it('labels xiaoyu concept, architecture and test evidence without a runtime screenshot', () => {
    window.history.pushState({}, '', '/?project=xiaoyu&focus=product')
    render(<App />)

    const region = screen.getByRole('region', { name: '公开证据' })
    expect(within(region).getByText('本地双角色长期陪伴系统')).toBeInTheDocument()
    expect(within(region).getByText('概念视觉')).toBeInTheDocument()
    expect(within(region).getByText('系统架构')).toBeInTheDocument()
    expect(within(region).getByText('自动化测试证据')).toBeInTheDocument()
    expect(within(region).getByText(/不是产品运行截图/)).toBeInTheDocument()
    expect(within(region).getByText(/436\/436 项当前 V3 自动化测试通过/)).toBeInTheDocument()
    expect(within(region).queryByText('真实运行证据')).not.toBeInTheDocument()
    expect(within(region).getByRole('link', { name: '查看“概念视觉”原图' })).toBeInTheDocument()
    expect(within(region).getByRole('link', { name: '查看“系统架构”原图' })).toBeInTheDocument()
    expect(within(region).getByRole('link', { name: '查看“自动化测试证据”原图' })).toBeInTheDocument()
  })

  it('does not render evidence images on the portfolio homepage', () => {
    window.history.pushState({}, '', '/')
    const { container } = render(<App />)
    expect(container.querySelector('img[src*="/evidence/"]')).not.toBeInTheDocument()
  })
})
