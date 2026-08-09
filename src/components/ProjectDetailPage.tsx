import { lazy, Suspense, useEffect, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { EvidenceMedia, EvidenceRecord, ProjectCase } from '../data/types'
import { publicContent } from '../data/content'
import { assetPath } from '../utils/assets'
import { parseRoleLens } from '../utils/focus'
import { getProjectDocumentTitle } from '../utils/pageTitle'
import { createProjectChapterLink } from '../utils/projectDeepLink'
import { getProjectVisual } from '../data/projectVisuals'
import { CircularText } from './CircularText'
import { FadeIn } from './FadeIn'
import { ProjectEvidenceGallery } from './ProjectEvidenceGallery'

const ProjectBento = lazy(() => import('./ProjectBento').then((module) => ({
  default: module.ProjectBento,
})))

interface ProjectDetailPageProps {
  project: ProjectCase
  evidence: EvidenceRecord[]
  media: EvidenceMedia[]
  onClose: (projectId: string, homeUrl: string) => void
}

const chapterLinks = [
  ['understanding', '理解'],
  ['contribution', '贡献'],
  ['audience', '对象'],
  ['flow', '流程'],
  ['architecture', '架构'],
  ['code', '代码'],
  ['evidence', '证据'],
  ['decisions', '取舍'],
] as const

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="case-numbered-list">
      {items.map((item, index) => (
        <li key={item}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <p>{item}</p>
        </li>
      ))}
    </ol>
  )
}

export function ProjectDetailPage({ project, evidence, media, onClose }: ProjectDetailPageProps) {
  const focus = parseRoleLens(new URLSearchParams(window.location.search).get('focus'))
  const homeUrl = focus === 'overview' ? '/#projects' : `/?focus=${focus}#projects`
  const visual = getProjectVisual(project.id)
  const { codeExample } = project.details
  const openedFromProjectHash = !new URLSearchParams(window.location.search).has('project')
  const titleRef = useRef<HTMLHeadingElement>(null)

  const closeProject = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    window.sessionStorage.setItem('portfolio-return-focus', project.id)
    onClose(project.id, homeUrl)
  }

  useEffect(() => {
    const previousTitle = document.title
    let firstFrame = 0
    let secondFrame = 0
    let cancelled = false
    document.title = getProjectDocumentTitle(project.title)

    const focusTitle = async () => {
      await document.fonts?.ready
      if (cancelled) return
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          if (cancelled) return
          const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth'
          window.scrollTo({ top: 0, behavior })
          titleRef.current?.focus({ preventScroll: true })
        })
      })
    }
    void focusTitle()

    return () => {
      cancelled = true
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
      document.title = previousTitle
    }
  }, [project.id, project.title])

  return (
    <div className="case-page">
      <header className="case-nav">
        <a href={homeUrl} onClick={closeProject}>← 返回作品集</a>
        <span>SLUMBER / WAKE LAB</span>
        <a href={`mailto:${publicContent.profile.email}`}>联系我 ↗</a>
      </header>

      <nav className="case-toc" aria-label="项目讲解目录">
        <span>CASE GUIDE</span>
        <div>
          {chapterLinks.map(([id, label], index) => (
            <a
              className="specular-surface"
              data-specular
              href={openedFromProjectHash
                ? createProjectChapterLink(project.id, focus, id)
                : `#${id}`}
              key={id}
            >
              {String(index + 1).padStart(2, '0')} {label}
            </a>
          ))}
        </div>
      </nav>

      <main>
        <section className="case-hero">
          <div className="case-hero__index">CASE / {project.id.toUpperCase()}</div>
          <FadeIn className="case-hero__title" y={48}>
            <p>{project.role}</p>
            <h1 ref={titleRef} tabIndex={-1}>{project.title}</h1>
          </FadeIn>
          <div className="case-hero__status">
            <span>{project.statusLabel}</span>
            <span>{project.tags.join(' · ')}</span>
          </div>
          <div className="case-hero__orbit" aria-hidden="true">
            <CircularText text="SLUMBER*WAKE*LAB*" spinDuration={24} onHover="speedUp" />
            <strong>S/W</strong>
          </div>
        </section>

        <section className="case-intro case-chapter" id="understanding">
          <FadeIn className="case-intro__statement" x={-40} y={0}>
            <span>01 / PROJECT UNDERSTANDING</span>
            <h2>{project.details.problem}</h2>
          </FadeIn>
          <FadeIn className="case-intro__summary" x={40} y={0} delay={0.1}>
            <p>{project.problem}</p>
            <p>{project.keyImplementation}</p>
          </FadeIn>
        </section>

        <figure className="case-artwork">
          <img src={assetPath(visual.src)} alt={visual.alt} width="1280" height="853" />
        </figure>

        <section className="case-contribution case-chapter" id="contribution">
          <header className="case-section-heading">
            <span>02 / MY CONTRIBUTION</span>
            <h2>哪些是我亲手完成的？</h2>
          </header>
          <NumberedList items={project.details.contribution} />
          <div className="case-contribution__actions">
            {project.github ? (
              <a className="specular-surface" data-specular href={project.github} target="_blank" rel="noopener noreferrer">
                查看 GitHub ↗
              </a>
            ) : (
              <p>当前没有公开仓库，以本案例中的已核验事实和脱敏代码为准。</p>
            )}
            <a className="specular-surface" data-specular href={homeUrl} onClick={closeProject}>继续浏览作品集 →</a>
          </div>
        </section>

        <Suspense fallback={<section className="project-bento" aria-label="正在加载项目讲解地图" />}>
          <ProjectBento project={project} />
        </Suspense>

        <section className="case-audience case-chapter" id="audience">
          <header className="case-section-heading">
            <span>03 / AUDIENCE &amp; SCENE</span>
            <h2>谁会使用它，发生在什么场景？</h2>
          </header>
          <NumberedList items={project.details.audience} />
        </section>

        <section className="case-flow case-chapter" id="flow">
          <header className="case-section-heading">
            <span>04 / USER FLOW &amp; FUNCTIONS</span>
            <h2>用户怎样完成一次任务？</h2>
          </header>
          <div className="case-flow__track" aria-label="项目用户流程">
            {project.details.userFlow.map((item, index) => (
              <article className="specular-surface" data-specular key={item}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
          <div className="case-feature-grid">
            {project.details.features.map((feature) => (
              <p className="specular-surface" data-specular key={feature}>{feature}</p>
            ))}
          </div>
        </section>

        <section className="case-architecture case-chapter" id="architecture">
          <header className="case-section-heading">
            <span>05 / ARCHITECTURE</span>
            <h2>系统怎样分工？</h2>
          </header>
          <div className="case-architecture__diagram" aria-label="项目架构与数据流">
            {project.details.architecture.map((layer, index) => (
              <article className="specular-surface" data-specular key={layer}>
                <span>L{String(index + 1).padStart(2, '0')}</span>
                <p>{layer}</p>
              </article>
            ))}
          </div>
          <div className="case-implementation">
            <h3>落地清单</h3>
            <NumberedList items={project.details.implementation} />
          </div>
        </section>

        <section className="case-code case-chapter" id="code">
          <header className="case-section-heading">
            <span>06 / REPRESENTATIVE CODE</span>
            <h2>读一段真正影响边界的代码。</h2>
            <p>{codeExample.title}</p>
          </header>
          <div className="case-code__layout">
            <pre aria-label={`${project.shortTitle} 代表代码`} tabIndex={0}>
              <code>{codeExample.code}</code>
            </pre>
            <dl>
              <div><dt>输入</dt><dd>{codeExample.input}</dd></div>
              <div><dt>判断</dt><dd>{codeExample.judgment}</dd></div>
              <div><dt>输出</dt><dd>{codeExample.output}</dd></div>
              <div><dt>为什么这样设计</dt><dd>{codeExample.rationale}</dd></div>
            </dl>
          </div>
          <aside className="case-code__explanation" aria-labelledby="code-explanation-title">
            <span>PLAIN LANGUAGE / 通俗解释</span>
            <h3 id="code-explanation-title">这段代码实现了什么？</h3>
            <p><strong>它接收：</strong>{codeExample.input}</p>
            <p><strong>执行时：</strong>{codeExample.judgment}</p>
            <p><strong>最终得到：</strong>{codeExample.output}</p>
          </aside>
        </section>

        <section className="case-evidence case-chapter" id="evidence">
          <header className="case-section-heading">
            <span>07 / EVIDENCE, FAILURE &amp; BOUNDARY</span>
            <h2>证据、失败路径和边界一起讲。</h2>
          </header>
          <div className="case-evidence__grid">
            {evidence.map((item, index) => (
              <article className="specular-surface" data-specular key={item.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{item.detail}</h3>
                <p>
                  {item.framework ?? '项目验收'}
                  {item.verifiedAt ? ` · 最近核验于 ${item.verifiedAt}` : ''}
                </p>
                {item.boundary ? <small>{item.boundary}</small> : null}
              </article>
            ))}
            <article className="case-evidence__failures specular-surface" data-specular>
              <span>FAIL SAFE</span>
              <h3>系统如何失败</h3>
              <ul>
                {project.details.failurePaths.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </div>
          <ProjectEvidenceGallery project={project} media={media} />
          <p className="case-evidence__boundary">{project.details.boundary}</p>
        </section>

        <section className="case-decisions case-chapter" id="decisions">
          <FadeIn className="case-column" y={36}>
            <span>08 / KEY TRADE-OFFS</span>
            <h2>做什么，也明确不做什么。</h2>
            <NumberedList items={project.details.tradeoffs} />
          </FadeIn>
          <FadeIn className="case-column case-column--blue" y={36} delay={0.12}>
            <span>WHY IT MATTERS</span>
            <h2>取舍决定了产品的可信边界。</h2>
            <p className="case-decision-note">{project.details.boundary}</p>
          </FadeIn>
        </section>
      </main>
    </div>
  )
}
