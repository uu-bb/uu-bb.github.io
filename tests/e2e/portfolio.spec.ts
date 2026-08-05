import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('首屏完整呈现招聘信息与求职路径，且不请求 GLB', async ({ page }) => {
  const modelRequests: string[] = []
  const evidenceRequests: string[] = []
  page.on('request', (request) => {
    if (/\.glb(?:$|\?)/i.test(request.url())) modelRequests.push(request.url())
    if (/\/evidence\/.*\.png(?:$|\?)/i.test(request.url())) evidenceRequests.push(request.url())
  })

  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('杨皓博')
  await expect(page.locator('#top').getByText('SLEEPY LAB / 睡醒实验室')).toBeVisible()
  await expect(page.locator('#top').getByText('AI 产品 × AI 应用工程')).toBeVisible()
  await expect(page.locator('#top').getByText(/可控、可验证、能交付的 AI 产品/)).toBeVisible()
  await expect(page.locator('#top').getByText(/2027 届本科 · 深圳/)).toBeVisible()
  await expect(page.locator('#top').getByText(/可尽快到岗 · 每周 5 天/)).toBeVisible()
  await expect(page.getByRole('link', { name: '查看核心项目' })).toBeVisible()
  await expect(page.getByRole('link', { name: '查看综合简历' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: '联系我' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: '下载 PDF' }).first()).toBeVisible()
  await expect(page.getByRole('region', { name: '核心项目证据' })).toBeVisible()
  await expect(page.locator('.stack-project')).toHaveCount(3)

  if ((page.viewportSize()?.width ?? 0) <= 360) {
    await expect(page.getByRole('link', { name: '查看核心项目' })).toBeInViewport()
  }

  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(layout.content).toBeLessThanOrEqual(layout.viewport)
  expect(modelRequests).toEqual([])
  expect(evidenceRequests).toEqual([])
})

test('Phase 1A 关键视口保持可读、完整且无横向溢出', async ({ page }) => {
  const viewports = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
    { width: 768, height: 1024 },
  ]

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const metrics = await page.evaluate(() => {
      const hero = document.querySelector<HTMLElement>('.hero-stage')
      const nav = document.querySelector<HTMLElement>('.site-nav')
      const eyebrow = document.querySelector<HTMLElement>('.hero-stage__eyebrow')
      const statusItems = [...document.querySelectorAll<HTMLElement>('.hero-stage__status p')]
      const secondaryLinks = [...document.querySelectorAll<HTMLElement>('.hero-secondary-links a')]
      const capabilities = [...document.querySelectorAll<HTMLElement>('.hero-capabilities li')]
      const primaryAction = document.querySelector<HTMLElement>('.hero-actions .button--primary')
      const visual = document.querySelector<HTMLElement>('.hero-stage__visual')
      const capabilityBar = document.querySelector<HTMLElement>('.hero-capabilities')
      const menuButton = document.querySelector<HTMLElement>('.mobile-menu-button')
      const menuLines = [...document.querySelectorAll<HTMLElement>('.hamburger-line')]

      if (!hero || !nav || !eyebrow || !primaryAction || !visual || !capabilityBar) {
        throw new Error('Phase 1A hero elements are missing')
      }

      const statusStyle = getComputedStyle(statusItems[0])
      const statusFontSize = Number.parseFloat(statusStyle.fontSize)
      const statusLineHeight = Number.parseFloat(statusStyle.lineHeight)
      const menuRect = menuButton?.getBoundingClientRect()
      const lineTops = menuLines.map((line) => line.getBoundingClientRect().top)

      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        heroHeight: hero.getBoundingClientRect().height,
        navBottom: nav.getBoundingClientRect().bottom,
        eyebrowTop: eyebrow.getBoundingClientRect().top,
        primaryBottom: primaryAction.getBoundingClientRect().bottom,
        visualTop: visual.getBoundingClientRect().top,
        visualBottom: visual.getBoundingClientRect().bottom,
        visualHeight: visual.getBoundingClientRect().height,
        capabilityBottom: capabilityBar.getBoundingClientRect().bottom,
        statusTexts: statusItems.map((item) => item.textContent?.trim()),
        statusFontSize,
        statusLineHeight,
        statusWhiteSpace: statusItems.map((item) => getComputedStyle(item).whiteSpace),
        secondaryLinkHeights: secondaryLinks.map((link) => link.getBoundingClientRect().height),
        capabilityFontSizes: capabilities.map((item) => Number.parseFloat(getComputedStyle(item).fontSize)),
        menuWidth: menuRect?.width ?? 0,
        menuHeight: menuRect?.height ?? 0,
        menuLineSeparation: lineTops.length === 2 ? Math.abs(lineTops[1] - lineTops[0]) : 0,
      }
    })

    expect(metrics.documentWidth, `${viewport.width}×${viewport.height} 横向溢出`).toBeLessThanOrEqual(
      metrics.viewportWidth,
    )

    if (viewport.width > 980) {
      expect(metrics.eyebrowTop).toBeGreaterThan(metrics.navBottom + 72)
      expect(metrics.eyebrowTop).toBeLessThan(metrics.navBottom + metrics.heroHeight * 0.22)
      expect(metrics.capabilityBottom).toBeLessThanOrEqual(viewport.height)
    }

    if (viewport.width <= 390) {
      expect(metrics.statusTexts).toEqual([
        '2027 届本科 · 深圳',
        '寻找 AI 产品 / AI 应用工程实习',
        '可尽快到岗 · 每周 5 天 · 可持续 3 个月以上',
      ])
      expect(metrics.statusFontSize).toBeGreaterThanOrEqual(12)
      expect(metrics.statusLineHeight / metrics.statusFontSize).toBeGreaterThanOrEqual(1.55)
      expect(metrics.statusWhiteSpace).toEqual(['nowrap', 'nowrap', 'nowrap'])
      expect(Math.min(...metrics.secondaryLinkHeights)).toBeGreaterThanOrEqual(44)
      expect(Math.min(...metrics.capabilityFontSizes)).toBeGreaterThanOrEqual(12)
      expect(metrics.menuWidth).toBeGreaterThanOrEqual(44)
      expect(metrics.menuHeight).toBeGreaterThanOrEqual(44)
      expect(metrics.menuLineSeparation).toBeGreaterThanOrEqual(7)
      expect(metrics.primaryBottom).toBeLessThanOrEqual(viewport.height)
      expect(metrics.visualTop).toBeGreaterThan(metrics.primaryBottom)
      expect(metrics.visualHeight).toBeGreaterThanOrEqual(304)
      expect(metrics.visualBottom).toBeLessThanOrEqual(viewport.height + 1)
    }
  }

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: '杨皓博' })).toBeVisible()
  await expect(page.locator('#top').getByText('寻找 AI 产品 / AI 应用工程实习', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '查看核心项目' })).toBeInViewport()
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

test('核心证据链接定位到首页对应的完整项目卡', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('region', { name: '核心项目证据' })
    .getByRole('link', { name: '查看深圳 AI 求职助手' })
    .click()
  await expect(page).toHaveURL(/#job-assistant$/)
  await expect(page.locator('#job-assistant')).toBeInViewport()
  await expect(page.locator('#job-assistant').getByRole('link', { name: '阅读案例 ↗' })).toBeVisible()
})

test('彩色弧形画廊自动加载并遵守滚轮方向', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('region', { name: 'Scenes from the lab.' }).scrollIntoViewIfNeeded()
  const gallery = page.locator('.circular-gallery')
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
    await expect(menuButton.locator('.hamburger-line')).toHaveCount(2)
    await menuButton.press('Enter')
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    await expect(menuButton).toHaveAccessibleName('关闭导航菜单')
    await expect(page.locator('#mobile-primary-menu').getByRole('link', { name: '项目' })).toBeVisible()
    await menuButton.press('Escape')
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    await expect(menuButton).toBeFocused()
    await menuButton.press('Space')
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
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

test('求职助手与 RAG 按人工冻结顺序展示公开运行证据', async ({ page }) => {
  const cases = [
    {
      id: 'job-assistant',
      heading: '真实运行证据',
      mediaIds: ['ja-analysis', 'ja-preview-confirmation', 'ja-validation-guard'],
    },
    {
      id: 'rag-knowledge-base',
      heading: '真实运行证据',
      mediaIds: ['rag-query-with-sources', 'rag-no-match-fallback', 'rag-knowledge-status'],
    },
  ] as const

  for (const item of cases) {
    await page.goto(`/?project=${item.id}&focus=ai-app`)
    const region = page.getByRole('region', { name: item.heading })
    await region.scrollIntoViewIfNeeded()
    await expect(region.locator('figure')).toHaveCount(3)
    expect(await region.locator('figure').evaluateAll((figures) =>
      figures.map((figure) => figure.getAttribute('data-evidence-id')),
    )).toEqual(item.mediaIds)
    for (const image of await region.locator('img').all()) {
      await expect(image).toHaveAttribute('loading', 'lazy')
      await expect(image).toHaveAttribute('decoding', 'async')
      await expect(image).toHaveAttribute('width', /\d+/)
      await expect(image).toHaveAttribute('height', /\d+/)
    }
  }

  await page.goto('/?project=rag-knowledge-base&focus=ai-app')
  const ragRegion = page.getByRole('region', { name: '真实运行证据' })
  await expect(ragRegion).toContainText('Lite')
  await expect(ragRegion).toContainText('不证明大规模业务吞吐或生产质量')
})

test('小u鱼只展示概念、架构与当前 V3 测试证据', async ({ page }) => {
  await page.goto('/?project=xiaoyu&focus=product')
  const region = page.getByRole('region', { name: '公开证据' })
  await region.scrollIntoViewIfNeeded()

  await expect(region).toContainText('本地双角色长期陪伴系统')
  await expect(region.getByText('概念视觉')).toBeVisible()
  await expect(region.getByText('系统架构')).toBeVisible()
  await expect(region.getByText('自动化测试证据')).toBeVisible()
  await expect(region).toContainText('不是产品运行截图')
  await expect(region).toContainText('436/436 项当前 V3 自动化测试通过')
  await expect(region).toContainText('DPAPI 持久化与 LLM 边界为冻结权威合同')
  await expect(region).toContainText('不代表代码覆盖率')
  await expect(region.locator('[data-evidence-type="runtime-screenshot"]')).toHaveCount(0)
})

test('移动端证据保持单列并且 360×800 无水平滚动', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?project=job-assistant&focus=ai-app')
  const region = page.getByRole('region', { name: '真实运行证据' })
  await region.scrollIntoViewIfNeeded()
  const boxes = await region.locator('figure').evaluateAll((figures) =>
    figures.map((figure) => {
      const rect = figure.getBoundingClientRect()
      return { left: rect.left, top: rect.top, bottom: rect.bottom }
    }),
  )
  expect(new Set(boxes.map((box) => Math.round(box.left))).size).toBe(1)
  expect(boxes[1].top).toBeGreaterThanOrEqual(boxes[0].bottom)
  expect(boxes[2].top).toBeGreaterThanOrEqual(boxes[1].bottom)

  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/?project=xiaoyu&focus=product')
  const layout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(layout.content).toBeLessThanOrEqual(layout.viewport)
})

test('键盘可到达证据区域，返回作品集后焦点回到原项目入口', async ({ page }) => {
  await page.goto('/?project=job-assistant&focus=ai-app')
  const evidenceRegion = page.getByRole('region', { name: '真实运行证据' })
  await evidenceRegion.focus()
  await expect(evidenceRegion).toBeFocused()

  await page.getByRole('link', { name: '← 返回作品集' }).click()
  await expect(page).toHaveURL(/#projects$/)
  await expect(page.locator('[data-project-link="job-assistant"]')).toBeFocused()
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

  const directContact = page.getByRole('group', { name: '直接联系方式' })
  const optionalTopics = page.getByRole('region', { name: '可选联系话题' })
  await expect(directContact.getByText('正在寻找 AI 产品 / AI 应用工程实习')).toBeVisible()
  await expect(directContact.getByRole('link', { name: '发送邮件' })).toBeVisible()
  await expect(directContact.getByRole('link', { name: '查看简历' })).toBeVisible()
  await expect(optionalTopics.getByText('你也可以先选择想聊的话题')).toBeVisible()
  const directTop = await directContact.evaluate((element) => element.getBoundingClientRect().top)
  const optionalTop = await optionalTopics.evaluate((element) => element.getBoundingClientRect().top)
  expect(directTop).toBeLessThan(optionalTop)

  const github = directContact.getByRole('link', { name: 'GitHub' })
  await expect(github).toHaveAttribute('href', 'https://github.com/uu-bb')
  await expect(github).toHaveAttribute('rel', /noopener/)

  await directContact.getByRole('button', { name: '复制邮箱' }).click()
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

test('JavaScript 关闭时仍有完整职业摘要、项目证据与联系入口', async ({ browser }) => {
  const page = await browser.newPage({ javaScriptEnabled: false })
  await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173/')
  const staticPortfolio = page.locator('.static-portfolio:visible')
  await expect(staticPortfolio.getByRole('heading', { level: 1, name: '杨皓博' })).toBeVisible()
  await expect(staticPortfolio.getByText('AI 产品 × AI 应用工程')).toBeVisible()
  await expect(staticPortfolio.getByText(/2027 届本科 · 深圳/)).toBeVisible()
  await expect(staticPortfolio.getByText('AI 产品设计')).toBeVisible()
  await expect(staticPortfolio.getByText('深圳 AI 求职助手')).toBeVisible()
  await expect(staticPortfolio.getByText('小u鱼')).toBeVisible()
  await expect(staticPortfolio.getByText('RAG 智能知识库')).toBeVisible()
  await expect(staticPortfolio.getByText('32/32 项测试通过')).toBeVisible()
  await expect(staticPortfolio.getByText('436/436 项当前 V3 自动化测试通过')).toBeVisible()
  await expect(staticPortfolio.getByText(['29', '29'].join('/'))).toHaveCount(0)
  await expect(staticPortfolio.getByText('7/7 项 Lite 与元数据链路测试通过')).toBeVisible()
  await expect(staticPortfolio.getByRole('link', { name: '查看综合简历' })).toHaveAttribute(
    'href',
    '/resume/yang-haobo-ai-product-application.pdf',
  )
  await expect(staticPortfolio.getByRole('link', { name: '920816086@qq.com' })).toHaveAttribute(
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
