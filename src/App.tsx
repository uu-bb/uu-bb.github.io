import { useEffect, useMemo, useState } from 'react'
import './styles.css'
import './editorial.css'
import { AnimatedText } from './components/AnimatedText'
import { ClickSpark } from './components/ClickSpark'
import { EvidenceOverview } from './components/EvidenceOverview'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ExperienceSection } from './components/ExperienceSection'
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
import siteCopy from './data/siteCopy.json'
import type { RoleLens } from './data/types'
import { assetPath } from './utils/assets'
import { getProjectOrder, isRoleLens, parseRoleLens } from './utils/focus'

const coreProjectIds = ['job-assistant', 'careerpilot', 'rag-knowledge-base']

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
    note: '把客户需求、方案表达和实现能力放在同一条叙事里。',
    headline: '从客户提到的一个真实问题出发，把需求、方案和实现连起来。',
    focusTopics: ['需求是否讲清楚', '方案是否可交付', '实现能否演示', '问题能否闭环'],
    capabilities: [
      {
        title: 'Requirement Framing',
        description: '把客户口头的业务场景、关注点与待确认事项，整理成可跟进、可核对的需求内容。',
      },
      {
        title: 'Solution Writing',
        description: '把沟通结论写成方案说明、问题记录与汇报材料，保证客户与内部同一口径。',
      },
      {
        title: 'AI Delivery',
        description: '用 RAG、Agent 与结构化输出，把方案落成可演示、可验收的系统。',
      },
      {
        title: 'Problem Closure',
        description: '从现象、复现信息到处理结果逐项记录，推动问题走到闭环，而不是止于一次回复。',
      },
    ],
  },
  presales: {
    label: '售前与方案',
    note: '优先阅读需求梳理、方案表达、演示准备与沟通口径。',
    headline: '先听懂客户在担心什么，再把能力翻译成他能验收的方案。',
    focusTopics: ['客户与场景', '需求梳理', '方案与文档', '演示与答疑'],
    capabilities: [
      {
        title: 'Customer Discovery',
        description: '记录业务场景、关注点与待确认事项，把口头信息变成可跟进的问题清单。',
      },
      {
        title: 'Solution Documentation',
        description: '持续维护方案说明、问题记录与沟通材料，让客户与内部信息口径保持一致。',
      },
      {
        title: 'Demo & Answering',
        description: '准备可演示的 POC 与技术说明，正面回应客户对能力范围和边界的追问。',
      },
      {
        title: 'Talking Points',
        description: '把技术能力翻译成客户能判断的价值表述，不夸大尚未验证的能力。',
      },
    ],
  },
  support: {
    label: '技术支持与交付',
    note: '优先阅读问题排查、现场沟通、交付流程与文档沉淀。',
    headline: '把问题从现象追到根因，再把结论沉淀成下次能直接复用的材料。',
    focusTopics: ['问题复现', '排查与定位', '进度与闭环', '文档沉淀'],
    capabilities: [
      {
        title: 'Issue Reproduction',
        description: '整理现象、复现步骤与处理结果，为技术定位和客户沟通提供可核对的依据。',
      },
      {
        title: 'Troubleshooting',
        description: '参与问题排查并记录判断过程，让定位结论可以被复核，而不只是口头结论。',
      },
      {
        title: 'Delivery Tracking',
        description: '跟进客户与内部反馈，更新方案与处理进度，推动问题真正走到闭环。',
      },
      {
        title: 'Knowledge Handover',
        description: '把每次排查与交付经验沉淀成文档，降低同类问题的重复沟通成本。',
      },
    ],
  },
  'ai-app': {
    label: 'AI 应用',
    note: '优先阅读 RAG、Agent、结构化输出和完整工作流。',
    headline: '让模型负责不确定性，让规则、结构和证据负责可控性。',
    focusTopics: ['检索与来源', 'Agent 契约', '结构化输出', '降级路径'],
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
        title: 'Failure Paths',
        description: '把无匹配、输入缺失和越权动作都设计成明确降级，而不是静默失败。',
      },
    ],
  },
}

const contactIntents = [
  {
    label: '秋招岗位',
    code: '01 / CAMPUS HIRING',
    title: '一起聊聊合适的校招岗位。',
    description: '如果你正在找愿意理解客户问题、也能把方案写到能落地的应届生，可以把岗位、团队和期待告诉我。',
    subject: '秋招岗位｜来自 Slumber Wake Lab',
  },
  {
    label: '项目合作',
    code: '02 / COLLABORATION',
    title: '把一个还模糊的想法聊清楚。',
    description: '欢迎讨论 AI 方案落地、RAG、Agent 工作流或 Python 应用的合作可能。',
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
  { label: '经历', href: '#experience' },
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
  const resumePath = assetPath('resume/yang-haobo-resume.pdf')

  useEffect(() => {
    const syncLensFromUrl = () => {
      const url = new URL(window.location.href)
      const requestedLens = url.searchParams.get('focus')
      const nextLens = parseRoleLens(requestedLens)

      if (requestedLens !== null && !isRoleLens(requestedLens)) {
        url.searchParams.set('focus', 'overview')
        window.history.replaceState(window.history.state, '', url)
      }
      setLens(nextLens)
    }

    syncLensFromUrl()
    window.addEventListener('popstate', syncLensFromUrl)
    return () => window.removeEventListener('popstate', syncLensFromUrl)
  }, [])

  useEffect(() => {
    const state = window.history.state as { portfolioReturnFocus?: string } | null
    const projectId = state?.portfolioReturnFocus
      ?? window.sessionStorage.getItem('portfolio-return-focus')
    if (!projectId) return
    window.sessionStorage.removeItem('portfolio-return-focus')
    const frame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLAnchorElement>(
        `[data-project-link="${projectId}"]`,
      )?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
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
    if (url.href !== window.location.href) {
      window.history.pushState({}, '', url)
    }
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
            text={`我是${publicContent.profile.name}。两段实习一段做客户需求沟通与方案闭环，一段按业务方需求开发 AI 业务系统；关注 ${publicContent.profile.skills.join('、')}，也在意每一条结论有没有依据、每一个能力有没有边界。`}
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

        <ExperienceSection />

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
              <p className="contact-direct__status">{siteCopy.contactHeadline}</p>
              <h3>{publicContent.profile.name}</h3>
              <p>{siteCopy.contactStatus}</p>
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
        <span>事实可追溯 · 边界可说明 · 方案可交付</span>
        <a href="#top">返回顶部 ↑</a>
      </footer>
    </div>
  )
}

function App() {
  const readRequestedProjectId = () => {
    const url = new URL(window.location.href)
    const queryProjectId = url.searchParams.get('project')
    if (queryProjectId && projectById.has(queryProjectId)) return queryProjectId

    let hashProjectId = ''
    try {
      hashProjectId = decodeURIComponent(url.hash.replace(/^#/, ''))
    } catch {
      return null
    }
    return url.searchParams.has('focus') && projectById.has(hashProjectId)
      ? hashProjectId
      : null
  }
  const [requestedProjectId, setRequestedProjectId] = useState(readRequestedProjectId)

  useEffect(() => {
    const syncProjectFromUrl = () => {
      const url = new URL(window.location.href)
      const requestedLens = url.searchParams.get('focus')
      if (requestedLens !== null && !isRoleLens(requestedLens)) {
        url.searchParams.set('focus', 'overview')
        window.history.replaceState(window.history.state, '', url)
      }
      setRequestedProjectId(readRequestedProjectId())
    }
    syncProjectFromUrl()
    window.addEventListener('popstate', syncProjectFromUrl)
    window.addEventListener('hashchange', syncProjectFromUrl)
    return () => {
      window.removeEventListener('popstate', syncProjectFromUrl)
      window.removeEventListener('hashchange', syncProjectFromUrl)
    }
  }, [])

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
