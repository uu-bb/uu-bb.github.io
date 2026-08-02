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
  await expect(page.getByRole('heading', {
    name: '先把用户、场景和边界讲清楚，再决定 AI 应该出现在哪里。',
  })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Problem Framing' })).toBeVisible()
  await expect(page.locator('.stack-project h3').first()).toHaveText('小u鱼 Windows 智能桌宠')
  await expect(page.getByRole('link', { name: '阅读案例 ↗' })).toHaveCount(3)
})

test('彩色弧形画廊自动加载并遵守滚轮方向', async ({ page }) => {
  await page.goto('/')
  const gallery = page.locator('.circular-gallery')
  await gallery.scrollIntoViewIfNeeded()
  await expect(gallery).toBeVisible()
  await expect(gallery.locator('canvas')).toBeVisible()
  await expect(page.locator('.circular-gallery__status')).toContainText('FRAME')

  await gallery.dispatchEvent('wheel', { deltaY: 420 })
  await expect(gallery).toHaveAttribute('data-wheel-direction', 'right')
  await gallery.dispatchEvent('wheel', { deltaY: -420 })
  await expect(gallery).toHaveAttribute('data-wheel-direction', 'left')
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
    const projectNav = page.locator('.pill[href="#projects"]')
    await expect(projectNav).toBeVisible()
    await projectNav.click()
    await expect(page).toHaveURL(/#projects$/)
    await page.getByRole('link', { name: '返回首页' }).click()
    await expect(page).toHaveURL(/#top$/)
  }

  const wakeToggle = page.locator('.hero-wake')
  await expect(wakeToggle).toHaveAttribute('aria-pressed', 'true')
  await wakeToggle.click()
  await expect(wakeToggle).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.hero-stage')).not.toHaveClass(/is-awake/)
  await expect(page.locator('.hero-stage__media--sleep')).toHaveCSS('opacity', '1')
})

test('核心项目采用独立微场景且不叠加解释性图注', async ({ page }) => {
  await page.goto('/#projects')

  const projectImages = page.locator('.stack-project__visual img')
  await expect(projectImages).toHaveCount(3)
  const sources = await projectImages.evaluateAll((images) =>
    images.map((image) => image.getAttribute('src')),
  )
  expect(new Set(sources).size).toBe(3)
  await expect(page.locator('.stack-project__visual figcaption')).toHaveCount(0)
  await expect(page.locator('figcaption').filter({ hasText: '左：' })).toHaveCount(0)
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

test('四个项目链接都提供完整讲解结构与代表代码', async ({ page }) => {
  const cases = [
    ['job-assistant', '深圳 AI 求职助手'],
    ['xiaoyu', '小u鱼 Windows 智能桌宠'],
    ['rag-knowledge-base', 'RAG 智能知识库问答系统'],
    ['agent-toolkit', 'Agent Service Toolkit 岗位匹配 Agent'],
  ] as const

  for (const [id, title] of cases) {
    await page.goto(`/?project=${id}&focus=ai-app`)
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(page.getByRole('navigation', { name: '项目讲解目录' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '谁会使用它，发生在什么场景？' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '用户怎样完成一次任务？' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '系统怎样分工？' })).toBeVisible()
    await expect(page.getByRole('heading', { name: /先看懂.*再看细节/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: '项目理解' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '关键取舍与边界' })).toBeVisible()
    await expect(page.locator('.case-code pre')).toBeVisible()
    await expect(page.getByRole('heading', { name: '这段代码实现了什么？' })).toBeVisible()
    await expect(page.locator('.case-artwork figcaption')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: '哪些是我亲手完成的？' })).toBeVisible()

    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(layout.content).toBeLessThanOrEqual(layout.viewport)
  }
})

test('简历、邮箱复制和 GitHub 入口有效', async ({ page, request, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/#contact')

  const resume = await request.get('/resume/yang-haobo-ai-product-application.pdf')
  expect(resume.ok()).toBeTruthy()
  expect(resume.headers()['content-type']).toContain('application/pdf')

  const download = page.getByRole('link', { name: '下载 PDF' }).first()
  await expect(download).toHaveAttribute(
    'download',
    '杨皓博_AI产品与应用工程_公开简历.pdf',
  )
  await expect(page.locator('.contact-editorial__links').getByRole('link', { name: '下载 PDF ↓' })).toHaveCount(0)

  const aboutContactLinks = page.locator('.about-contact-card__link')
  await expect(aboutContactLinks).toHaveCount(2)
  const aboutLinkStyles = await aboutContactLinks.evaluateAll((links) => links.map((link) => {
    const styles = window.getComputedStyle(link)
    return {
      minHeight: styles.minHeight,
      padding: styles.padding,
      borderRadius: styles.borderRadius,
      borderTop: `${styles.borderTopWidth} ${styles.borderTopStyle} ${styles.borderTopColor}`,
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
    }
  }))
  expect(aboutLinkStyles[0]).toEqual(aboutLinkStyles[1])

  const github = page.getByRole('link', { name: 'GitHub ↗' })
  await expect(github).toHaveAttribute('href', 'https://github.com/uu-bb')
  await expect(github).toHaveAttribute('rel', /noopener/)

  await page.getByRole('button', { name: '复制邮箱' }).click()
  await expect(page.getByRole('status')).toHaveText('邮箱已复制')
})

test('3D 导览台把能力选择连接到真实项目与证据', async ({ page }) => {
  await page.goto('/#lab')

  const ragGuide = page.getByRole('button', { name: '02 RAG 系统' })
  await ragGuide.click()
  await expect(ragGuide).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.lab-guide__project h4')).toHaveText('RAG 智能知识库问答系统')
  await expect(page.locator('.lab-guide__project')).toContainText('7 项测试通过 · unittest')
  await expect(page.getByRole('link', { name: '进入项目讲解 ↗' })).toHaveAttribute(
    'href',
    '/?project=rag-knowledge-base&focus=ai-app',
  )
})

test('联系转盘支持键盘选择并生成对应邮件主题', async ({ page }) => {
  await page.goto('/#contact')

  const wheel = page.getByRole('listbox', { name: '选择联系目的' })
  await wheel.press('ArrowDown')
  await expect(page.getByRole('option', { name: '项目合作' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('heading', { name: '把一个还模糊的想法聊清楚。' })).toBeVisible()
  await expect(page.getByRole('link', { name: '以“项目合作”为主题写信 ↗' })).toHaveAttribute(
    'href',
    `mailto:920816086@qq.com?subject=${encodeURIComponent('项目合作｜来自 Slumber Wake Lab')}`,
  )
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
  const modelErrors: string[] = []
  page.on('request', (request) => {
    if (/\.glb(?:$|\?)/i.test(request.url())) requests.push(request.url())
  })
  page.on('console', (message) => {
    if (message.type() === 'error' && /GLTFLoader|texture|blob:|WebAssembly/i.test(message.text())) {
      modelErrors.push(message.text())
    }
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
  await expect(page.locator('.three-canvas canvas')).toBeVisible()
  await page.waitForTimeout(700)
  expect(modelErrors).toEqual([])
})
