import { useCallback, useEffect, useMemo, useState } from 'react'
import './styles.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LazyLab } from './components/LazyLab'
import { ProjectCard } from './components/ProjectCard'
import { evidenceById, projectById, publicContent } from './data/content'
import type { RoleLens } from './data/types'
import { assetPath } from './utils/assets'
import { getProjectOrder, parseRoleLens } from './utils/focus'

const lensLabels: Record<RoleLens, { label: string; note: string }> = {
  overview: {
    label: '综合',
    note: '产品判断与工程交付放在同一条叙事里。',
  },
  product: {
    label: 'AI 产品',
    note: '优先看需求拆解、范围取舍、验收与安全边界。',
  },
  'ai-app': {
    label: 'AI 应用',
    note: '优先看 RAG、Agent、结构化输出与完整工作流。',
  },
  python: {
    label: 'Python 后端',
    note: '优先看接口、状态模型、输入校验与自动化可靠性。',
  },
}

function waitForStableLayout(): Promise<void> {
  const fontsReady = document.fonts?.ready ?? Promise.resolve()
  return fontsReady.then(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }),
  )
}

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
  const [openProject, setOpenProject] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState('')
  const [awake, setAwake] = useState(false)

  const orderedProjects = useMemo(
    () =>
      getProjectOrder(lens)
        .map((id) => projectById.get(id))
        .filter((project) => project !== undefined),
    [lens],
  )

  const applyLocationState = useCallback(async () => {
    const url = new URL(window.location.href)
    const nextLens = parseRoleLens(url.searchParams.get('focus'))
    const projectId = decodeURIComponent(url.hash.replace(/^#/, ''))
    setLens(nextLens)

    if (!projectId || !projectById.has(projectId)) {
      setOpenProject(null)
      return
    }
    setOpenProject(projectId)
    await waitForStableLayout()

    const section = document.getElementById(projectId)
    const heading = document.getElementById(`project-detail-title-${projectId}`)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    section?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    heading?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    void applyLocationState()
    const restore = () => void applyLocationState()
    window.addEventListener('popstate', restore)
    window.addEventListener('hashchange', restore)
    return () => {
      window.removeEventListener('popstate', restore)
      window.removeEventListener('hashchange', restore)
    }
  }, [applyLocationState])

  const updateLens = (nextLens: RoleLens) => {
    setLens(nextLens)
    setOpenProject(null)
    const url = new URL(window.location.href)
    if (nextLens === 'overview') url.searchParams.delete('focus')
    else url.searchParams.set('focus', nextLens)
    url.hash = ''
    window.history.pushState({}, '', url)
  }

  const toggleProject = (projectId: string, shouldOpen: boolean) => {
    setOpenProject(shouldOpen ? projectId : null)
    const url = new URL(window.location.href)
    url.hash = shouldOpen ? projectId : ''
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

  const resumePath = assetPath('resume/yang-haobo-ai-product-application.pdf')

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>

      <header className="site-nav" aria-label="主导航">
        <a className="brand-lockup" href="#top" aria-label="返回首页">
          <span className="brand-mark" aria-hidden="true">Z</span>
          <span>YHB / LAB</span>
        </a>
        <nav>
          <a href="#projects">项目</a>
          <a href="#focus">方向</a>
          <a href="#contact">联系</a>
        </nav>
        <a className="nav-resume" href={resumePath} target="_blank" rel="noopener noreferrer">
          简历 ↗
        </a>
      </header>

      <main id="main-content">
        <section className="hero-section" id="top">
          <div className="hero-copy">
            <p className="eyebrow">AI PRODUCT × APPLICATION ENGINEERING</p>
            <h1>
              杨皓博 <span>·</span>
              <br />睡醒实验室
            </h1>
            <p className="hero-role">{publicContent.profile.role}</p>
            <p className="hero-tagline">{publicContent.profile.tagline}</p>

            <ul className="skill-pills" aria-label="核心能力">
              {publicContent.profile.skills.map((skill, index) => (
                <li key={skill} className={`skill-pill skill-pill--${index + 1}`}>
                  {skill}
                </li>
              ))}
            </ul>

            <p className="availability">{publicContent.profile.statusLine}</p>

            <div className="hero-actions" aria-label="主要操作">
              <a className="button button--primary" href="#projects">查看项目</a>
              <a className="button button--secondary" href="#focus">切换方向</a>
              <a
                className="button button--secondary"
                href={resumePath}
                target="_blank"
                rel="noopener noreferrer"
              >
                查看综合简历
              </a>
              <a
                className="button button--text"
                href={resumePath}
                aria-label="下载 PDF"
                download="杨皓博_AI产品与应用工程_公开简历.pdf"
              >
                下载 PDF ↓
              </a>
            </div>
          </div>

          <div className={`hero-visual${awake ? ' is-awake' : ''}`}>
            <div className="hero-visual__labels" aria-hidden="true">
              <span>LAB / 01</span>
              <span>READY TO SHIP</span>
            </div>
            <picture>
              <source
                type="image/webp"
                srcSet={`${assetPath('character/sleepy-boy-hero-384.webp')} 384w, ${assetPath('character/sleepy-boy-hero-640.webp')} 640w`}
                sizes="(max-width: 767px) 86vw, 40vw"
              />
              <img
                src={assetPath('character/sleepy-boy-hero.png')}
                alt="穿睡衣伸懒腰的睡眼角色"
                width="640"
                height="1280"
                fetchPriority="high"
              />
            </picture>
            <button type="button" className="wake-button" onClick={() => setAwake((value) => !value)}>
              <span aria-hidden="true">{awake ? '●' : '○'}</span>
              {awake ? '实验室已醒' : '叫醒实验室'}
            </button>
          </div>
        </section>

        <section className="section evidence-section" aria-labelledby="evidence-title">
          <div className="section-heading">
            <p className="eyebrow">PROOF BEFORE PROMISE</p>
            <h2 id="evidence-title">先看证据，再谈能力。</h2>
          </div>
          <div className="evidence-grid">
            {publicContent.evidence.slice(0, 3).map((item, index) => (
              <article key={item.id} className={`evidence-card evidence-card--${index + 1}`}>
                <span className="evidence-card__number">0{index + 1}</span>
                <h3>{item.label}</h3>
                <p>{item.framework ?? '项目验收'}</p>
                <small>核验于 {item.verifiedAt}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="section featured-case" aria-labelledby="featured-title">
          <div className="featured-case__index" aria-hidden="true">01</div>
          <div>
            <p className="eyebrow">FIRST CASE / CONTROLLED AGENT</p>
            <h2 id="featured-title">不是让 Agent 自动点得更快，<br />而是让每一步都可确认。</h2>
          </div>
          <div className="featured-case__flow" aria-label="求职助手流程">
            {['发现岗位', '抽取证据', '匹配评分', '人工确认', '结果核验'].map(
              (step, index) => (
                <div key={step}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{step}</strong>
                </div>
              ),
            )}
          </div>
          <p className="featured-case__summary">
            深圳 AI 求职助手把岗位搜索、JD 结构化、证据匹配、简历推荐与人工确认串成一个状态闭环。
          </p>
          <a href="#job-assistant">进入完整案例 ↓</a>
        </section>

        <section className="section focus-section" id="focus" aria-labelledby="focus-title">
          <div className="section-heading">
            <p className="eyebrow">ONE FACT / FOUR LENSES</p>
            <h2 id="focus-title">固定事实，只换观察角度。</h2>
            <p>{lensLabels[lens].note}</p>
          </div>
          <div className="lens-tabs" role="group" aria-label="切换求职方向">
            {(Object.keys(lensLabels) as RoleLens[]).map((lensId) => (
              <button
                key={lensId}
                type="button"
                className={lens === lensId ? 'is-active' : ''}
                aria-pressed={lens === lensId}
                onClick={() => updateLens(lensId)}
              >
                <span>{lensLabels[lensId].label}</span>
                <small>{lensId === 'overview' ? 'DEFAULT' : lensId.toUpperCase()}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="section projects-section" id="projects" aria-labelledby="projects-title">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">SELECTED WORK / {lensLabels[lens].label}</p>
              <h2 id="projects-title">三个项目，讲清怎么做成。</h2>
            </div>
            <p>项目事实只维护一次；当前视角只改变排序和重点证据。</p>
          </div>

          <div className="project-list">
            {orderedProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                evidence={project.evidenceIds
                  .map((id) => evidenceById.get(id))
                  .filter((item) => item !== undefined)}
                index={index}
                isOpen={openProject === project.id}
                lens={lens}
                onToggle={toggleProject}
              />
            ))}
          </div>
        </section>

        <section className="section experiments-section" aria-labelledby="experiments-title">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">MORE EXPERIMENTS</p>
              <h2 id="experiments-title">更多实验，不挤占主线。</h2>
            </div>
            <p>保留真实边界：实验原型就是原型，开源二次开发明确上游来源。</p>
          </div>
          <div className="experiment-grid">
            {publicContent.experiments.map((experiment, index) => {
              const content = (
                <>
                  <div className="experiment-card__meta">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <span>{experiment.statusLabel}</span>
                  </div>
                  <h3>{experiment.title}</h3>
                  <p>{experiment.summary}</p>
                  <div className="tag-list">
                    {experiment.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                </>
              )
              return experiment.github ? (
                <a
                  className="experiment-card"
                  href={experiment.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={experiment.id}
                >
                  {content}
                </a>
              ) : (
                <article className="experiment-card" key={experiment.id}>{content}</article>
              )
            })}
          </div>
        </section>

        <LazyLab />

        <section className="section contact-section" id="contact" aria-labelledby="contact-title">
          <div className="contact-intro">
            <p className="eyebrow">EDUCATION / CONTACT</p>
            <h2 id="contact-title">如果你在找能把 AI 做成产品的人，聊聊。</h2>
            <p>
              电子科技大学中山学院 · 人工智能本科 · 2023.09–2027.06 · CET-4
            </p>
          </div>

          <div className="contact-panel">
            <div>
              <span>EMAIL</span>
              <a href={`mailto:${publicContent.profile.email}`}>{publicContent.profile.email}</a>
              <button type="button" onClick={copyEmail}>复制邮箱</button>
            </div>
            <div>
              <span>GITHUB</span>
              <a href={publicContent.profile.github} target="_blank" rel="noopener noreferrer">
                github.com/uu-bb ↗
              </a>
            </div>
            <div>
              <span>RESUME</span>
              <a href={resumePath} target="_blank" rel="noopener noreferrer">在线查看 ↗</a>
              <a
                href={resumePath}
                aria-label="下载公开简历 PDF"
                download="杨皓博_AI产品与应用工程_公开简历.pdf"
              >
                下载 PDF ↓
              </a>
            </div>
          </div>
          <p className="copy-status" role="status" aria-live="polite">{copyStatus}</p>
        </section>
      </main>

      <footer>
        <span>杨皓博 · 睡醒实验室</span>
        <span>事实可追溯 / 边界可说明 / 产品可交付</span>
        <a href="#top">回到顶部 ↑</a>
      </footer>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Portfolio />
    </ErrorBoundary>
  )
}

export default App
