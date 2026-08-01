import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('首屏无需互动即可完成求职核心路径，且不请求 GLB', async ({ page }) => {
  const modelRequests: string[] = []
  page.on('request', (request) => {
    if (/\.glb(?:$|\?)/i.test(request.url())) modelRequests.push(request.url())
  })

  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('杨皓博')
  await expect(page.getByText(/2027 届本科.*深圳.*每周 5 天/)).toBeVisible()
  await expect(page.getByRole('link', { name: '查看项目' })).toBeVisible()
  await expect(page.getByRole('link', { name: '查看综合简历' })).toBeVisible()
  await expect(page.getByRole('link', { name: '下载 PDF' })).toHaveAttribute(
    'download',
    '杨皓博_AI产品与应用工程_公开简历.pdf',
  )
  await expect(page.locator('.project-card')).toHaveCount(3)
  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(layout.content).toBeLessThanOrEqual(layout.viewport)
  expect(modelRequests).toEqual([])
})

test('深链接恢复透镜、展开详情并把焦点送到详情标题', async ({ page }) => {
  await page.goto('/?focus=ai-app#agent-toolkit')

  await expect(page.getByRole('button', { name: 'AI 应用' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  const detail = page.locator('#project-detail-agent-toolkit')
  await expect(detail).toBeVisible()
  await expect(page.locator('#project-detail-title-agent-toolkit')).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(detail).toHaveCount(0)
  await expect(page.getByRole('button', { name: '展开Agent Service Toolkit 岗位匹配 Agent详情' })).toBeFocused()

  await page.goBack()
  await expect(page.locator('#project-detail-agent-toolkit')).toBeVisible()
  await page.goForward()
  await expect(page.locator('#project-detail-agent-toolkit')).toHaveCount(0)
})

test('项目展开合同、简历入口、邮箱复制和外链属性有效', async ({ page, request, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')

  const toggle = page.locator('#job-assistant .project-card__toggle')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(toggle).toHaveAttribute('aria-controls', 'project-detail-job-assistant')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('#project-detail-job-assistant')).toBeVisible()

  const resume = await request.get('/resume/yang-haobo-ai-product-application.pdf')
  expect(resume.ok()).toBeTruthy()
  expect(resume.headers()['content-type']).toContain('application/pdf')

  const github = page.getByRole('link', { name: /github\.com\/uu-bb/ })
  await expect(github).toHaveAttribute('href', 'https://github.com/uu-bb')
  await expect(github).toHaveAttribute('rel', /noopener/)
  await page.getByRole('button', { name: '复制邮箱' }).click()
  await expect(page.getByRole('status')).toHaveText('邮箱已复制')
})

test('没有阻断级无障碍问题', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const blocking = results.violations.filter((item) =>
    ['critical', 'serious'].includes(item.impact ?? ''),
  )
  expect(blocking).toEqual([])
})

test('JavaScript 关闭时仍有简历与联系静态入口', async ({ browser }) => {
  const page = await browser.newPage({ javaScriptEnabled: false })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '杨皓博 · 睡醒实验室' })).toBeVisible()
  await expect(page.getByRole('link', { name: '查看综合简历' })).toHaveAttribute(
    'href',
    '/resume/yang-haobo-ai-product-application.pdf',
  )
  await expect(page.getByRole('link', { name: '920816086@qq.com' })).toHaveAttribute(
    'href',
    'mailto:920816086@qq.com',
  )
  await page.close()
})

test('3D 只在进入实验室后按设备规则加载', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (/\.glb(?:$|\?)/i.test(request.url())) requests.push(request.url())
  })
  await page.goto('/')
  expect(requests).toEqual([])

  await page.locator('#lab').scrollIntoViewIfNeeded()
  if ((page.viewportSize()?.width ?? 0) <= 767) {
    await page.waitForTimeout(250)
    expect(requests).toEqual([])
    await page.getByRole('button', { name: '加载可交互 3D' }).click()
  }
  await expect.poll(() => requests.length).toBeGreaterThan(0)
})
