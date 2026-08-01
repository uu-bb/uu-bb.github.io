import { useEffect, useMemo, useState } from 'react'
import './styles.css'
import './editorial.css'
import { AnimatedText } from './components/AnimatedText'
import { CircularText } from './components/CircularText'
import { ClickSpark } from './components/ClickSpark'
import { ErrorBoundary } from './components/ErrorBoundary'
import { FadeIn } from './components/FadeIn'
import { LazyLab } from './components/LazyLab'
import { Magnet } from './components/Magnet'
import { MarqueeSection } from './components/MarqueeSection'
import { PillNav } from './components/PillNav'
import { ProjectDetailPage } from './components/ProjectDetailPage'
import { ProjectShowcaseCard } from './components/ProjectShowcaseCard'
import { SideRays } from './components/SideRays'
import { evidenceById, projectById, publicContent } from './data/content'
import type { RoleLens } from './data/types'
import { assetPath } from './utils/assets'
import { getProjectOrder, parseRoleLens } from './utils/focus'

const coreProjectIds = ['job-assistant', 'xiaoyu', 'rag-knowledge-base']

const heroIntroduction = {
  identity: '产品思考 × 技术实现 × 独立创作',
  statement: '我喜欢把模糊的想法，做成清晰、可运行、值得继续生长的作品。',
  openness: '保持好奇，持续做作品，也欢迎新的问题、合作与创作可能。',
}

const lensMeta: Record<RoleLens, { label: string; note: string }> = {
  overview: {
    label: '综合',
    note: '把产品判断、AI 能力和工程交付放在同一条叙事里。',
  },
  product: {
    label: 'AI 产品',
    note: '优先阅读场景拆解、范围取舍、验收标准与安全边界。',
  },
  'ai-app': {
    label: 'AI 应用',
    note: '优先阅读 RAG、Agent、结构化输出和完整工作流。',
  },
  python: {
    label: 'Python 后端',
    note: '优先阅读接口、状态模型、输入校验与自动化可靠性。',
  },
}

const capabilities = [
  {
    title: 'RAG Systems',
    description: '把检索、融合、重排、来源和降级路径组织成可解释的知识链路。',
  },
  {
    title: 'Agent Workflows',
    description: '用白名单、状态机、人工确认和结构化契约控制 Agent 的副作用。',
  },
  {
    title: 'FastAPI Backend',
    description: '围绕真实业务状态设计接口、校验、持久化和自动化测试。',
  },
  {
    title: 'Product Delivery',
    description: '从问题定义、MVP 取舍到验收证据，持续把想法收敛成可交付版本。',
  },
]

function copyWithFallback(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value)

  const field = document.createElement('textarea')
  field.value = value
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.appendChild(field)
  field.select()
  const copied = document.execCommand('copy')
  field.remove()
  return copied ? Promise.resolve() : Promise.reject(new Error('copy failed'))
}

function Portfolio() {
  const initialLens = parseRoleLens(
    new URLSearchParams(window.location.search).get('focus'),
  )
  const [lens, setLens] = useState<RoleLens>(initialLens)
  const [copyStatus, setCopyStatus] = useState('')
  const [awake, setAwake] = useState(true)
  const [heroReady, setHeroReady] = useState(false)
  const resumePath = assetPath('resume/yang-haobo-ai-product-application.pdf')
  const navigationItems = [
    { label: '关于', href: '#about' },
    { label: '能力', href: '#focus' },
    { label: '项目', href: '#projects' },
    { label: '联系', href: '#contact' },
  ]

  const orderedProjects = useMemo(() => {
    const orderedIds = [...getProjectOrder(lens), ...coreProjectIds]
    const uniqueCoreIds = orderedIds.filter(
      (id, index) => coreProjectIds.includes(id) && orderedIds.indexOf(id) === index,
    )
    return uniqueCoreIds
      .map((id) => projectById.get(id))
      .filter((project) => project !== undefined)
      .slice(0, 3)
  }, [lens])

  const updateLens = (nextLens: RoleLens) => {
    setLens(nextLens)
    const url = new URL(window.location.href)
    url.searchParams.delete('project')
    if (nextLens === 'overview') url.searchParams.delete('focus')
    else url.searchParams.set('focus', nextLens)
    url.hash = 'projects'
    window.history.pushState({}, '', url)
  }

  const copyEmail = async () => {
    try {
      await copyWithFallback(publicContent.profile.email)
      setCopyStatus('邮箱已复制')
    } catch {
      setCopyStatus('复制失败，请手动选择邮箱')
    }
    window.setTimeout(() => setCopyStatus(''), 2400)
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHeroReady(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="site-shell editorial-site">
      <a className="skip-link" href="#main-content">跳到主要内容</a>

      <header className="site-nav" aria-label="主导航">
        <a className="brand-lockup" href="#top" aria-label="返回首页">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>SLUMBER / WAKE</span>
        </a>
        <PillNav
          items={navigationItems}
          baseColor="#d7e2ea"
          pillColor="#111820"
          pillTextColor="#d7e2ea"
          hoveredPillTextColor="#111820"
          initialLoadAnimation={false}
        />
        <a className="nav-resume" href={resumePath} target="_blank" rel="noopener noreferrer">
          简历 ↗
        </a>
      </header>

      <main id="main-content">
        <section
          className={`hero-stage${awake ? ' is-awake' : ''}${heroReady ? ' is-ready' : ''}`}
          id="top"
        >
          <Magnet className="hero-stage__magnet" padding={180} strength={42}>
            <picture className="hero-stage__media hero-stage__media--sleep">
              <source
                type="image/webp"
                srcSet={`${assetPath('cover/slumber-sleep-768.webp')} 768w, ${assetPath('cover/slumber-sleep-1280.webp')} 1280w, ${assetPath('cover/slumber-sleep-1672.webp')} 1672w`}
                sizes="100vw"
              />
              <img
                src={assetPath('cover/slumber-sleep-1672.webp')}
                alt="角色戴着睡帽在深色卧室的床上安静入睡"
                width="1672"
                height="941"
              />
            </picture>
            <picture className="hero-stage__media hero-stage__media--awake">
              <source
                type="image/webp"
                srcSet={`${assetPath('cover/slumber-wake-transition-768.webp')} 768w, ${assetPath('cover/slumber-wake-transition-1280.webp')} 1280w, ${assetPath('cover/slumber-wake-transition-1672.webp')} 1672w`}
                sizes="100vw"
              />
              <img
                src={assetPath('cover/slumber-wake-transition-1672.webp')}
                alt="角色从昏暗睡眠空间伸懒腰走向明亮创作工作台"
                width="1672"
                height="941"
                fetchPriority="high"
              />
            </picture>
          </Magnet>
          <SideRays
            className={`hero-stage__rays${awake ? ' is-awake' : ''}`}
            speed={0.18}
            rayColor1="#f6d69a"
            rayColor2="#79aeca"
            intensity={0.72}
            spread={1.2}
            origin="top-right"
            tilt={-10}
            saturation={0.72}
            blend={0.28}
            falloff={1.62}
            opacity={0.56}
          />
          <div className="hero-stage__shade" aria-hidden="true" />

          <FadeIn className="hero-stage__edition" y={-18}>
            <span>PORTFOLIO / 2026</span>
            <span>SHENZHEN / AVAILABLE</span>
          </FadeIn>

          <FadeIn className="hero-wordmark" y={44} delay={0.12}>
            <h1 aria-label="Slumber Wake Lab · 睡醒实验室">
              <span className="hero-wordmark__slumber">Slumber</span>
              <span className="hero-wordmark__wake">Wake Lab</span>
            </h1>
          </FadeIn>

          <Magnet className="hero-orbit" padding={120} strength={8}>
            <CircularText
              text="SLUMBER*WAKE*LAB*"
              spinDuration={20}
              onHover="speedUp"
            />
            <strong aria-hidden="true">S/W</strong>
          </Magnet>

          <FadeIn className="hero-stage__intro" y={24} delay={0.32}>
            <p>{publicContent.profile.name} · {heroIntroduction.identity}</p>
            <p>{heroIntroduction.statement}</p>
            <p>{heroIntroduction.openness}</p>
          </FadeIn>

          <FadeIn className="hero-actions" y={24} delay={0.4}>
            <a className="button button--primary" href="#projects">查看项目</a>
            <a className="button button--secondary" href="#focus">切换方向</a>
            <a className="button button--secondary" href={resumePath} target="_blank" rel="noopener noreferrer">
              查看综合简历
            </a>
            <a
              className="button button--text"
              href={resumePath}
              download="杨皓博_AI产品与应用工程_公开简历.pdf"
              aria-label="下载 PDF"
            >
              下载 PDF ↓
            </a>
          </FadeIn>

          <button
            className="hero-wake"
            type="button"
            aria-pressed={awake}
            onClick={() => setAwake((value) => !value)}
          >
            <span aria-hidden="true">{awake ? '●' : '○'}</span>
            {awake ? '让实验室入睡' : '叫醒实验室'}
          </button>
        </section>

        <MarqueeSection />

        <section className="about-editorial" id="about" aria-labelledby="about-title">
          <div className="about-editorial__label">ABOUT / PERSONAL STATEMENT</div>
          <FadeIn y={48}>
            <h2 id="about-title">About<br />the maker.</h2>
          </FadeIn>
          <AnimatedText
            className="about-editorial__text"
            text={`我是${publicContent.profile.name}。我把产品判断、AI 应用和 Python 工程放在同一条工作流里，关注 ${publicContent.profile.skills.join('、')}，也在意每一次实现的测试证据、安全边界与真实交付。`}
          />
          <FadeIn className="about-editorial__action" y={24}>
            <div className="about-contact-card">
              <p>如果你对我的作品、合作方式或正在探索的问题感兴趣，可以直接写信给我。</p>
              <div>
                <a
                  href={`mailto:${publicContent.profile.email}?subject=${encodeURIComponent('来自 Slumber Wake Lab 的联系')}`}
                >
                  发送邮件 ↗
                </a>
                <a className="about-contact-card__email" href={`mailto:${publicContent.profile.email}`}>
                  {publicContent.profile.email}
                </a>
              </div>
            </div>
          </FadeIn>
        </section>

        <section className="capabilities-section" id="focus" aria-labelledby="capabilities-title">
          <FadeIn y={48}>
            <p className="section-kicker">WHAT I BUILD / FOUR LENSES</p>
            <h2 id="capabilities-title">Capabilities</h2>
          </FadeIn>

          <div className="lens-switcher" role="group" aria-label="切换求职方向">
            {(Object.keys(lensMeta) as RoleLens[]).map((lensId) => (
              <button
                key={lensId}
                type="button"
                className={lens === lensId ? 'is-active' : ''}
                aria-pressed={lens === lensId}
                onClick={() => updateLens(lensId)}
              >
                <span>{lensMeta[lensId].label}</span>
                <small>{lensId === 'overview' ? 'DEFAULT' : lensId.toUpperCase()}</small>
              </button>
            ))}
          </div>
          <p className="lens-note">{lensMeta[lens].note}</p>

          <div className="capability-list">
            {capabilities.map((capability, index) => (
              <FadeIn className="capability-item" y={38} delay={index * 0.08} key={capability.title}>
                <span>0{index + 1}</span>
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
              </FadeIn>
            ))}
          </div>
        </section>

        <section className="projects-editorial" id="projects" aria-labelledby="projects-title">
          <div className="projects-editorial__heading">
            <FadeIn y={44}>
              <p className="section-kicker">SELECTED WORK / {lensMeta[lens].label}</p>
              <h2 id="projects-title">Projects</h2>
            </FadeIn>
            <p>首页只保留三个核心项目；每个案例进入独立阅读页，完整展示问题、取舍、实现、证据与边界。</p>
          </div>

          <div className="project-stack">
            {orderedProjects.map((project, index) => (
              <ProjectShowcaseCard
                key={project.id}
                project={project}
                evidence={project.evidenceIds
                  .map((id) => evidenceById.get(id))
                  .filter((item) => item !== undefined)}
                index={index}
                total={orderedProjects.length}
                lens={lens}
              />
            ))}
          </div>
        </section>

        <section className="experiments-editorial" aria-labelledby="experiments-title">
          <figure>
            <img
              src={assetPath('editorial/experiments-workbench.webp')}
              alt="左侧是正在制作和调试原型的试验工作台，右侧是按验证状态整理的成果归档架"
              width="1280"
              height="854"
              loading="lazy"
            />
            <figcaption>左：试验工作台 / 右：验证与归档</figcaption>
          </figure>
          <div className="experiments-editorial__content">
            <p className="section-kicker">MORE EXPERIMENTS</p>
            <h2 id="experiments-title">Field Notes</h2>
            <div className="experiment-index">
              {publicContent.experiments.map((experiment, index) => {
                const content = (
                  <>
                    <span>0{index + 1}</span>
                    <div>
                      <h3>{experiment.title}</h3>
                      <p>{experiment.summary}</p>
                    </div>
                    <small>{experiment.statusLabel}</small>
                  </>
                )
                return experiment.github ? (
                  <a key={experiment.id} href={experiment.github} target="_blank" rel="noopener noreferrer">
                    {content}
                  </a>
                ) : (
                  <article key={experiment.id}>{content}</article>
                )
              })}
            </div>
          </div>
        </section>

        <LazyLab />

        <section className="contact-editorial" id="contact" aria-labelledby="contact-title">
          <figure>
            <img
              src={assetPath('editorial/contact-conversation.webp')}
              alt="左侧是创作者收到并阅读邮件，中间的纸飞机沿蓝色路径前进，右侧是打开门后开始面对面协作"
              width="1280"
              height="853"
              loading="lazy"
            />
            <figcaption>左：收到消息 / 中：建立联系 / 右：开始协作</figcaption>
          </figure>
          <div className="contact-editorial__panel">
            <p className="section-kicker">CONTACT / BACK COVER</p>
            <h2 id="contact-title">Wake<br />something up.</h2>
            <p>{publicContent.profile.name} · {publicContent.profile.role}</p>
            <div className="contact-editorial__links">
              <a href={`mailto:${publicContent.profile.email}`}>{publicContent.profile.email}</a>
              <button type="button" onClick={copyEmail}>复制邮箱</button>
              <a href={publicContent.profile.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
              <a href={resumePath} target="_blank" rel="noopener noreferrer">查看简历 ↗</a>
              <a href={resumePath} download="杨皓博_AI产品与应用工程_公开简历.pdf">下载 PDF ↓</a>
            </div>
            <p className="copy-status" role="status" aria-live="polite">{copyStatus}</p>
          </div>
        </section>
      </main>

      <footer className="editorial-footer">
        <span>SLUMBER WAKE LAB / ISSUE 01</span>
        <span>事实可追溯 · 边界可说明 · 产品可交付</span>
        <a href="#top">返回顶部 ↑</a>
      </footer>
    </div>
  )
}

function App() {
  const requestedProjectId = new URLSearchParams(window.location.search).get('project')
  const project = requestedProjectId && coreProjectIds.includes(requestedProjectId)
    ? projectById.get(requestedProjectId)
    : undefined

  return (
    <ErrorBoundary>
      <ClickSpark>
        {project ? (
          <ProjectDetailPage
            project={project}
            evidence={project.evidenceIds
              .map((id) => evidenceById.get(id))
              .filter((item) => item !== undefined)}
          />
        ) : (
          <Portfolio />
        )}
      </ClickSpark>
    </ErrorBoundary>
  )
}

export default App
