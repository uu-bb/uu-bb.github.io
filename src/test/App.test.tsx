import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('portfolio experience', () => {
  it('shows recruiter-critical information without interaction', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Slumber Wake Lab · 睡醒实验室' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/持续做作品/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '查看项目' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '查看综合简历' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '下载 PDF' })).toBeInTheDocument()
  })

  it('switches the project lens while keeping three independent case links', () => {
    render(<App />)

    const productLens = screen.getByRole('button', { name: /AI 产品/ })
    expect(productLens).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(productLens)

    expect(productLens).toHaveAttribute('aria-pressed', 'true')
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

  it('turns a project route into a complete interview-ready walkthrough', () => {
    window.history.pushState({}, '', '/?project=job-assistant&focus=ai-app')
    render(<App />)

    expect(screen.getByRole('navigation', { name: '项目讲解目录' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '谁会使用它，发生在什么场景？' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '用户怎样完成一次任务？' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '系统怎样分工？' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '读一段真正影响边界的代码。' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '哪些是我亲手完成的？' })).toBeInTheDocument()
  })
})
