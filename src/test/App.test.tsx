import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('portfolio experience', () => {
  it('shows recruiter-critical information without interaction', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /杨皓博.*睡醒实验室/ }),
    ).toBeInTheDocument()
    expect(screen.getByText(/每周 5 天/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '查看项目' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '查看综合简历' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '下载 PDF' })).toBeInTheDocument()
  })

  it('uses the agreed disclosure accessibility contract', async () => {
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: /展开深圳 AI 求职助手详情/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-controls', 'project-detail-job-assistant')

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById('project-detail-job-assistant')).toBeInTheDocument()
  })
})
