import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('首屏完整呈现品牌与求职路径，且不请求 GLB', async ({ page }) => {
  const modelRequests: string[] = []
  page.on('request', (request) => {
    if (/\.glb(?:$|\?)/i.test(request.url())) modelRequests.push(request.url())
  })

  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
    'Slumber Wake Lab · 睡醒实验室',
  )
  await expect(
    page.locator('#top').getByText('杨皓博 · 产品思考 × 技术实现 × 独立创作'),
  ).toBeVisible()
  await expect(page.getByText(/持续做作品.*新的问题、合作与创作可能/)).toBeVisible()
  await expect(page.getByRole('link', { name: '查看项目' })).toBeVisible()
  await expect(page.getByRole('link', { name: '切换方向' })).toBeVisible()
  await expect(page.getByRole('link', { name: '查看综合简历' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: '下载 PDF' }).first()).toBeVisible()
  await expect(page.locator('.stack-project')).toHaveCount(3)

  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(layout.content).toBeLessThanOrEqual(layout.viewport)
  expect(modelRequests).toEqual([])
})

test('能力透镜更新叙事和项目排序', async ({ page }) => {
  await page.goto('/#focus')

  const productLens = page.getByRole('button', { name: /AI 产品/ })
  await productLens.click()
  await expect(productLens).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/\?focus=product#projects$/)
  await expect(page.locator('.stack-project h3').first()).toHaveText('小u鱼 Windows 智能桌宠')
  await expect(page.getByRole('link', { name: '阅读案例 ↗' })).toHaveCount(3)
})

test('首屏导航、睡醒切换和点击火花都可操作', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('.pill-nav')).toBeVisible()
  await expect(page.getByRole('navigation', { name: '页面导航' })).toBeVisible()
  await expect(page.locator('.click-spark-canvas')).toHaveAttribute('aria-hidden', 'true')

  if ((page.viewportSize()?.width ?? 0) <= 760) {
    const menuButton = page.locator('.mobile-menu-button')
    await expect(menuButton).toHaveAccessibleName('打开导航菜单')
    await menuButton.click()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    await expect(menuButton).toHaveAccessibleName('关闭导航菜单')
    await expect(page.locator('#mobile-primary-menu').getByRole('link', { name: '项目' })).toBeVisible()
    await menuButton.click()
  } else {
    await page.locator('.pill').filter({ hasText: '项目' }).hover()
    await expect(page.locator('.pill').filter({ hasText: '项目' }).locator('.pill-label-hover')).toHaveCSS(
      'opacity',
      '1',
    )
  }

  const wakeToggle = page.locator('.hero-wake')
  await expect(wakeToggle).toHaveAttribute('aria-pressed', 'true')
  await wakeToggle.click()
  await expect(wakeToggle).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.hero-stage')).not.toHaveClass(/is-awake/)
  await expect(page.locator('.hero-stage__media--sleep')).toHaveCSS('opacity', '1')
})

test('核心项目采用独立微场景并解释左右叙事', async ({ page }) => {
  await page.goto('/#projects')

  const projectImages = page.locator('.stack-project__visual img')
  await expect(projectImages).toHaveCount(3)
  const sources = await projectImages.evaluateAll((images) =>
    images.map((image) => image.getAttribute('src')),
  )
  expect(new Set(sources).size).toBe(3)
  await expect(page.getByText('左：分散岗位输入 / 中：整理与判断 / 右：排序、检查与确认')).toBeVisible()
  await expect(page.getByText('左：专注工作 / 右：低打扰陪伴与提醒')).toBeVisible()
  await expect(page.getByText('左：文档来源 / 中：混合检索 / 右：带引用回答')).toBeVisible()
})

test('三个核心项目使用可分享的独立案例页', async ({ page }) => {
  await page.goto('/?project=job-assistant&focus=ai-app')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('深圳 AI 求职助手')
  await expect(page.getByText('32/32 项测试通过')).toBeVisible()
  await expect(page.getByText(/最近核验于 2026-08-01/)).toBeVisible()
  await expect(page.getByRole('link', { name: '查看 GitHub ↗' })).toHaveAttribute(
    'rel',
    /noopener/,
  )
  await expect(page.getByRole('link', { name: '← 返回作品集' })).toHaveAttribute(
    'href',
    '/?focus=ai-app#projects',
  )

  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(layout.content).toBeLessThanOrEqual(layout.viewport)
})

test('简历、邮箱复制和 GitHub 入口有效', async ({ page, request, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/#contact')

  const resume = await request.get('/resume/yang-haobo-ai-product-application.pdf')
  expect(resume.ok()).toBeTruthy()
  expect(resume.headers()['content-type']).toContain('application/pdf')

  const download = page.getByRole('link', { name: '下载 PDF ↓' }).last()
  await expect(download).toHaveAttribute(
    'download',
    '杨皓博_AI产品与应用工程_公开简历.pdf',
  )

  const github = page.getByRole('link', { name: 'GitHub ↗' })
  await expect(github).toHaveAttribute('href', 'https://github.com/uu-bb')
  await expect(github).toHaveAttribute('rel', /noopener/)

  await page.getByRole('button', { name: '复制邮箱' }).click()
  await expect(page.getByRole('status')).toHaveText('邮箱已复制')
})

test('首页和独立案例页没有阻断级无障碍问题', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const url of ['/', '/?project=job-assistant']) {
    await page.goto(url)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const blocking = results.violations.filter((item) =>
      ['critical', 'serious'].includes(item.impact ?? ''),
    )
    expect(blocking).toEqual([])
  }
})

test('JavaScript 关闭时仍有简历与联系静态入口', async ({ browser }) => {
  const page = await browser.newPage({ javaScriptEnabled: false })
  await page.goto('http://127.0.0.1:4173/')
  await expect(page.getByRole('heading', { name: 'Slumber Wake Lab' })).toBeVisible()
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
