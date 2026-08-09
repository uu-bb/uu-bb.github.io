import { useEffect, useMemo, useState } from 'react'
import './styles.css'
import './editorial.css'
import { AnimatedText } from './components/AnimatedText'
import { ClickSpark } from './components/ClickSpark'
import { EvidenceOverview } from './components/EvidenceOverview'
import { ErrorBoundary } from './components/ErrorBoundary'
import { FadeIn } from './components/FadeIn'
import { LazyLab } from './components/LazyLab'
import { MarqueeSection } from './components/MarqueeSection'
import { OptionWheel } from './components/OptionWheel'
import { PillNav } from './components/PillNav'
import { ProjectDetailPage } from './components/ProjectDetailPage'
import { ProjectShowcaseCard } from './components/ProjectShowcaseCard'
import { RecruiterHero } from './components/RecruiterHero'
import { SpecularGlow } from './components/SpecularGlow'
import { evidenceById, evidenceMediaById, projectById, publicContent } from './data/content'
import type { RoleLens } from './data/types'
import { assetPath } from './utils/assets'
import { getProjectOrder, isRoleLens, parseRoleLens } from './utils/focus'
import { homepageDocumentTitle } from './utils/pageTitle'
import { readRequestedProjectId } from './utils/projectDeepLink'

const coreProjectIds = ['job-assistant', 'xiaoyu', 'rag-knowledge-base']

interface CapabilityItem {
  title: string
  description: string
}

interface LensDefinition {
  label: string
  note: string
  headline: string
  focusTopics: string[]
  capabilities: CapabilityItem[]
}

const lensMeta: Record<RoleLens, LensDefinition> = {
  overview: {
    label: '综合',
    note: '把产品判断、AI 能力和工程交付放在同一条叙事里。',
    headline: '从一个真实问题出发，把判断、实现、验证和交付连起来。',
    focusTopics: ['问题是否值得做', 'AI 能力如何受控', '工程是否可验证', '结果能否继续交付'],
    capabilities: [
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
    ],
  },
  product: {
    label: 'AI 产品',
    note: '优先阅读场景拆解、范围取舍、验收标准与安全边界。',
    headline: '先把用户、场景和边界讲清楚，再决定 AI 应该出现在哪里。',
    focusTopics: ['用户与场景', 'MVP 范围', '安全边界', '验收证据'],
    capabilities: [
      {
        title: 'Problem Framing',
        description: '把模糊诉求拆成具体用户、触发场景、任务路径和可验证问题。',
      },
      {
        title: 'MVP & Scope',
        description: '区分首版必须完成、后续增强和明确不做，控制产品承诺与实现成本。',
      },
      {
        title: 'Safe Interaction',
        description: '用人工确认、权限白名单、失败降级和清晰反馈守住高风险动作边界。',
      },
      {
        title: 'Acceptance Evidence',
        description: '把功能完成转换成可复查的测试、状态、日期和已知限制。',
      },
    ],
  },
  'ai-app': {
    label: 'AI 应用',
    note: '优先阅读 RAG、Agent、结构化输出和完整工作流。',
    headline: '让模型负责不确定性，让规则、结构和证据负责可控性。',
    focusTopics: ['检索与来源', 'Agent 契约', '结构化输出', '降级与评估'],
    capabilities: [
      {
        title: 'Retrieval Chain',
        description: '组合解析、Embedding、BM25、融合与重排，并保留来源和无模型降级路径。',
      },
      {
        title: 'Agent Contracts',
        description: '通过动作白名单、一次性令牌和人工确认，把模型建议与真实执行分开。',
      },
      {
        title: 'Structured Output',
        description: '用明确 Schema、输入校验和错误回退减少模型输出进入系统后的不确定性。',
      },
      {
        title: 'Evaluation Loop',
        description: '用测试、失败路径和核验日期说明系统在什么条件下可信、何时需要人工接管。',
      },
    ],
  },
  python: {
    label: 'Python 后端',
    note: '优先阅读接口、状态模型、输入校验与自动化可靠性。',
    headline: '把一次 Demo 变成可维护的接口、状态和确定性执行链路。',
    focusTopics: ['API 契约', '状态与持久化', '输入校验', '自动化测试'],
    capabilities: [
      {
        title: 'API Contracts',
        description: '围绕业务动作设计请求、响应、错误和权限边界，而不是只暴露模型调用。',
      },
      {
        title: 'State & Storage',
        description: '用清晰状态模型和持久化记录保证任务可追踪、可恢复、可人工核对。',
      },
      {
        title: 'Deterministic Automation',
        description: '把浏览器与系统操作收敛为确定性步骤，并限制外部副作用。',
      },
      {
        title: 'Testable Delivery',
        description: '用单元测试、接口测试和关键路径验证支撑版本交付与后续迭代。',
      },
    ],
  },
}

const contactIntents = [
  {
    label: '实习机会',
    code: '01 / INTERNSHIP',
    title: '一起聊聊合适的实习岗位。',
    description: '如果你正在寻找愿意理解问题、也能把方案做出来的实习生，可以把岗位、团队和期待告诉我。',
    subject: '实习机会｜来自 Slumber Wake Lab',
  },
  {
    label: '项目合作',
    code: '02 / COLLABORATION',
    title: '把一个还模糊的想法聊清楚。',
    description: '欢迎讨论 AI 产品原型、RAG、Agent 工作流或 Python 应用的合作可能。',
    subject: '项目合作｜来自 Slumber Wake Lab',
  },
  {
    label: '技术交流',
    code: '03 / TECH TALK',
    title: '交换方法、判断与踩坑经验。',
    description: '如果你也在做 AI 应用或工程实践，我们可以从真实问题和实现细节开始聊。',
    subject: '技术交流｜来自 Slumber Wake Lab',
  },
  {
    label: '作品反馈',
    code: '04 / FEEDBACK',
    title: '告诉我哪里清楚，哪里还不够。',
    description: '对项目叙事、交互或技术表达的具体反馈，都会帮助这个作品集继续生长。',
    subject: '作品反馈｜来自 Slumber Wake Lab',
  },
]

const contactIntentLabels = contactIntents.map((intent) => intent.label)

const navigationItems = [
  { label: '关于', href: '#about' },
  { label: '能力', href: '#focus' },
  { label: '项目', href: '#projects' },
  { label: '联系', href: '#contact' },
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
  const [contactIntentIndex, setContactIntentIndex] = useState(0)
  const contactIntent = contactIntents[contactIntentIndex]
  const resumePath = assetPath('resume/yang-haobo-ai-product-application.pdf')

  useEffect(() => {
    document.title = homepageDocumentTitle
  }, [])

  useEffect(() => {
    const historyState = window.history.state as { portfolioReturnFocus?: unknown } | null
    const storedProjectId = window.sessionStorage.getItem('portfolio-return-focus')
    const projectId = typeof historyState?.portfolioReturnFocus === 'string'
      ? historyState.portfolioReturnFocus
      : storedProjectId
    if (!projectId) return
    if (storedProjectId) window.sessionStorage.removeItem('portfolio-return-focus')
    const frame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLAnchorElement>(
        `[data-project-link="${projectId}"]`,
      )?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const syncLensFromUrl = () => {
      setLens(parseRoleLens(new URLSearchParams(window.location.search).get('focus')))
    }
    window.addEventListener('popstate', syncLensFromUrl)
    return () => window.removeEventListener('popstate', syncLensFromUrl)
  }, [])

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
    if (url.href !== window.location.href) window.history.pushState({}, '', url)
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
        <RecruiterHero resumePath={resumePath} />

        <EvidenceOverview />

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
                  className="about-contact-card__link specular-surface"
                  data-specular
                  href={`mailto:${publicContent.profile.email}?subject=${encodeURIComponent('来自 Slumber Wake Lab 的联系')}`}
                >
                  发送邮件 ↗
                </a>
                <a className="about-contact-card__link specular-surface" data-specular href={`mailto:${publicContent.profile.email}`}>
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
                className={`${lens === lensId ? 'is-active ' : ''}specular-surface`}
                data-specular
                aria-pressed={lens === lensId}
                onClick={() => updateLens(lensId)}
              >
                <span>{lensMeta[lensId].label}</span>
                <small>{lensId === 'overview' ? 'DEFAULT' : lensId.toUpperCase()}</small>
              </button>
            ))}
          </div>
          <div
            className="lens-current-state"
            role="status"
            aria-label="当前求职视角"
            aria-live="polite"
            aria-atomic="true"
            key={`lens-state-${lens}`}
          >
            <span>当前视角：<strong>{lensMeta[lens].label}</strong></span>
            <p>{lensMeta[lens].note}</p>
          </div>
          <div className="lens-story" key={lens} aria-live="polite">
            <div>
              <span>VIEWPOINT / {lensMeta[lens].label}</span>
              <h3>{lensMeta[lens].headline}</h3>
            </div>
            <div>
              <ul aria-label={`${lensMeta[lens].label}视角关注点`}>
                {lensMeta[lens].focusTopics.map((topic) => <li key={topic}>{topic}</li>)}
              </ul>
            </div>
          </div>

          <div className="capability-list">
            {lensMeta[lens].capabilities.map((capability, index) => (
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
                  <a className="specular-surface" data-specular key={experiment.id} href={experiment.github} target="_blank" rel="noopener noreferrer">
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
          </figure>
          <div className="contact-editorial__panel">
            <p className="section-kicker">CONTACT / BACK COVER</p>
            <h2 id="contact-title">Let&apos;s<br />talk.</h2>

            <div className="contact-direct" role="group" aria-label="直接联系方式">
              <p className="contact-direct__status">正在寻找 AI 产品 / AI 应用工程实习</p>
              <h3>{publicContent.profile.name}</h3>
              <p>深圳 · 可尽快到岗 · 每周 5 天</p>
              <a className="contact-direct__email" href={`mailto:${publicContent.profile.email}`}>
                {publicContent.profile.email}
              </a>
              <div className="contact-editorial__links">
                <a className="specular-surface" data-specular href={`mailto:${publicContent.profile.email}`}>发送邮件</a>
                <button className="specular-surface" data-specular type="button" onClick={copyEmail}>复制邮箱</button>
                <a className="specular-surface" data-specular href={resumePath} target="_blank" rel="noopener noreferrer">查看简历</a>
                <a className="specular-surface" data-specular href={publicContent.profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
              </div>
              <p className="copy-status" role="status" aria-live="polite">{copyStatus}</p>
            </div>

            <section className="contact-topics" aria-label="可选联系话题">
              <h3>你也可以先选择想聊的话题</h3>
              <div className="contact-choice">
                <div className="contact-choice__wheel">
                  <span>拖动 / 滚轮 / 方向键</span>
                  <OptionWheel
                    items={contactIntentLabels}
                    defaultSelected={0}
                    onChange={(index) => setContactIntentIndex(index)}
                    textColor="#07131a"
                    activeColor="#f4efe3"
                    fontSize={2.1}
                    spacing={1.28}
                    curve={0.9}
                    tilt={7}
                    blur={0.7}
                    fade={0}
                    minOpacity={1}
                    smoothing={170}
                    inset={14}
                    soundUrl=""
                    ariaLabel="选择联系目的"
                  />
                </div>
                <div className="contact-choice__detail" aria-live="polite">
                  <span>{contactIntent.code}</span>
                  <h3>{contactIntent.title}</h3>
                  <p>{contactIntent.description}</p>
                  <a
                    className="specular-surface"
                    data-specular
                    href={`mailto:${publicContent.profile.email}?subject=${encodeURIComponent(contactIntent.subject)}`}
                  >
                    以“{contactIntent.label}”为主题写信 ↗
                  </a>
                </div>
              </div>
            </section>
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
  const readProjectFromUrl = () => readRequestedProjectId(
    new URL(window.location.href),
    (projectId) => projectById.has(projectId),
  )
  const [requestedProjectId, setRequestedProjectId] = useState(readProjectFromUrl)

  useEffect(() => {
    const syncRouteFromUrl = () => {
      let url = new URL(window.location.href)
      const requestedFocus = url.searchParams.get('focus')
      if (requestedFocus !== null && !isRoleLens(requestedFocus)) {
        url = new URL(url)
        url.searchParams.set('focus', 'overview')
        window.history.replaceState(window.history.state, '', url)
      }
      setRequestedProjectId(readRequestedProjectId(
        url,
        (projectId) => projectById.has(projectId),
      ))
    }

    syncRouteFromUrl()
    window.addEventListener('popstate', syncRouteFromUrl)
    window.addEventListener('hashchange', syncRouteFromUrl)
    return () => {
      window.removeEventListener('popstate', syncRouteFromUrl)
      window.removeEventListener('hashchange', syncRouteFromUrl)
    }
  }, [])

  const closeProject = (projectId: string, homeUrl: string) => {
    const nextState = {
      ...(window.history.state && typeof window.history.state === 'object'
        ? window.history.state
        : {}),
      portfolioReturnFocus: projectId,
    }
    const url = new URL(homeUrl, window.location.origin)
    if (url.href === window.location.href) window.history.replaceState(nextState, '', url)
    else window.history.pushState(nextState, '', url)
    setRequestedProjectId(null)
  }

  const project = requestedProjectId
    ? projectById.get(requestedProjectId)
    : undefined

  return (
    <ErrorBoundary>
      <SpecularGlow>
        <ClickSpark>
          {project ? (
            <ProjectDetailPage
              project={project}
              evidence={project.evidenceIds
                .map((id) => evidenceById.get(id))
                .filter((item) => item !== undefined)}
              media={(project.evidenceMediaIds ?? [])
                .map((id) => evidenceMediaById.get(id))
                .filter((item) => item !== undefined)}
              onClose={closeProject}
            />
          ) : (
            <Portfolio />
          )}
        </ClickSpark>
      </SpecularGlow>
    </ErrorBoundary>
  )
}

export default App
