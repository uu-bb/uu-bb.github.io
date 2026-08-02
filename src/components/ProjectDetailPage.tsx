import { useEffect } from 'react'
import type { EvidenceRecord, ProjectCase } from '../data/types'
import { publicContent } from '../data/content'
import { assetPath } from '../utils/assets'
import { parseRoleLens } from '../utils/focus'
import { getProjectVisual } from '../data/projectVisuals'
import { CircularText } from './CircularText'
import { FadeIn } from './FadeIn'

interface ProjectDetailPageProps {
  project: ProjectCase
  evidence: EvidenceRecord[]
}

const chapterLinks = [
  ['understanding', '理解'],
  ['audience', '对象'],
  ['flow', '流程'],
  ['architecture', '架构'],
  ['decisions', '取舍'],
  ['code', '代码'],
  ['evidence', '证据'],
  ['contribution', '贡献'],
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

export function ProjectDetailPage({ project, evidence }: ProjectDetailPageProps) {
  const focus = parseRoleLens(new URLSearchParams(window.location.search).get('focus'))
  const homeUrl = focus === 'overview' ? '/#projects' : `/?focus=${focus}#projects`
  const visual = getProjectVisual(project.id)
  const { codeExample } = project.details

  useEffect(() => {
    const previousTitle = document.title
    document.title = `${project.title}｜Slumber Wake Lab`
    window.scrollTo({ top: 0, behavior: 'auto' })
    return () => {
      document.title = previousTitle
    }
  }, [project.title])

  return (
    <div className="case-page">
      <header className="case-nav">
        <a href={homeUrl}>← 返回作品集</a>
        <span>SLUMBER / WAKE LAB</span>
        <a href={`mailto:${publicContent.profile.email}`}>联系我 ↗</a>
      </header>

      <nav className="case-toc" aria-label="项目讲解目录">
        <span>CASE GUIDE</span>
        <div>
          {chapterLinks.map(([id, label], index) => (
            <a href={`#${id}`} key={id}>
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
            <h1>{project.title}</h1>
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
          <figcaption>{visual.caption}</figcaption>
        </figure>

        <section className="case-audience case-chapter" id="audience">
          <header className="case-section-heading">
            <span>02 / AUDIENCE &amp; SCENE</span>
            <h2>谁会使用它，发生在什么场景？</h2>
          </header>
          <NumberedList items={project.details.audience} />
        </section>

        <section className="case-flow case-chapter" id="flow">
          <header className="case-section-heading">
            <span>03 / USER FLOW &amp; FUNCTIONS</span>
            <h2>用户怎样完成一次任务？</h2>
          </header>
          <div className="case-flow__track" aria-label="项目用户流程">
            {project.details.userFlow.map((item, index) => (
              <article key={item}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
          <div className="case-feature-grid">
            {project.details.features.map((feature) => (
              <p key={feature}>{feature}</p>
            ))}
          </div>
        </section>

        <section className="case-architecture case-chapter" id="architecture">
          <header className="case-section-heading">
            <span>04 / ARCHITECTURE</span>
            <h2>系统怎样分工？</h2>
          </header>
          <div className="case-architecture__diagram" aria-label="项目架构与数据流">
            {project.details.architecture.map((layer, index) => (
              <article key={layer}>
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

        <section className="case-decisions case-chapter" id="decisions">
          <FadeIn className="case-column" y={36}>
            <span>05 / KEY TRADE-OFFS</span>
            <h2>做什么，也明确不做什么。</h2>
            <NumberedList items={project.details.tradeoffs} />
          </FadeIn>
          <FadeIn className="case-column case-column--blue" y={36} delay={0.12}>
            <span>WHY IT MATTERS</span>
            <h2>取舍决定了产品的可信边界。</h2>
            <p className="case-decision-note">{project.details.boundary}</p>
          </FadeIn>
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
        </section>

        <section className="case-evidence case-chapter" id="evidence">
          <header className="case-section-heading">
            <span>07 / EVIDENCE, FAILURE &amp; BOUNDARY</span>
            <h2>证据、失败路径和边界一起讲。</h2>
          </header>
          <div className="case-evidence__grid">
            {evidence.map((item, index) => (
              <article key={item.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{item.detail}</h3>
                <p>
                  {item.framework ?? '项目验收'}
                  {item.verifiedAt ? ` · 最近核验于 ${item.verifiedAt}` : ''}
                </p>
                {item.boundary ? <small>{item.boundary}</small> : null}
              </article>
            ))}
            <article className="case-evidence__failures">
              <span>FAIL SAFE</span>
              <h3>系统如何失败</h3>
              <ul>
                {project.details.failurePaths.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </div>
          <p className="case-evidence__boundary">{project.details.boundary}</p>
        </section>

        <section className="case-contribution case-chapter" id="contribution">
          <header className="case-section-heading">
            <span>08 / MY CONTRIBUTION</span>
            <h2>哪些是我亲手完成的？</h2>
          </header>
          <NumberedList items={project.details.contribution} />
          <div className="case-contribution__actions">
            {project.github ? (
              <a href={project.github} target="_blank" rel="noopener noreferrer">
                查看 GitHub ↗
              </a>
            ) : (
              <p>当前没有公开仓库，以本案例中的已核验事实和脱敏代码为准。</p>
            )}
            <a href={homeUrl}>继续浏览作品集 →</a>
          </div>
        </section>
      </main>
    </div>
  )
}
