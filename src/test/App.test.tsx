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
})
