import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('portfolio experience', () => {
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
    expect(productLens).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(productLens)

    expect(productLens).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', {
      name: '先把用户、场景和边界讲清楚，再决定 AI 应该出现在哪里。',
    })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Problem Framing' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'RAG Systems' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '阅读案例 ↗' })).toHaveLength(3)
    expect(screen.getAllByRole('link', { name: '阅读案例 ↗' })[0]).toHaveAttribute(
      'href',
      '/?project=xiaoyu&focus=product',
    )
    expect(screen.getByLabelText(/SLUMBER WAKE LAB/)).toBeInTheDocument()
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
      '/?project=rag-knowledge-base&focus=ai-app',
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
  })

  it('does not render evidence images on the portfolio homepage', () => {
    window.history.pushState({}, '', '/')
    const { container } = render(<App />)
    expect(container.querySelector('img[src*="/evidence/"]')).not.toBeInTheDocument()
  })
})
