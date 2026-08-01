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

export function ProjectDetailPage({ project, evidence }: ProjectDetailPageProps) {
  const focus = parseRoleLens(new URLSearchParams(window.location.search).get('focus'))
  const homeUrl = focus === 'overview' ? '/#projects' : `/?focus=${focus}#projects`
  const visual = getProjectVisual(project.id)

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

        <section className="case-intro">
          <FadeIn className="case-intro__statement" x={-40} y={0}>
            <span>01 / PROBLEM</span>
            <h2>{project.details.problem}</h2>
          </FadeIn>
          <FadeIn className="case-intro__summary" x={40} y={0} delay={0.1}>
            <p>{project.problem}</p>
            <p>{project.keyImplementation}</p>
          </FadeIn>
        </section>

        <figure className="case-artwork">
          <img
            src={assetPath(visual.src)}
            alt={visual.alt}
            width="1280"
            height="853"
          />
          <figcaption>{visual.caption}</figcaption>
        </figure>

        <section className="case-decisions">
          <FadeIn className="case-column" y={36}>
            <span>02 / TRADE-OFFS</span>
            <h2>做什么，也明确不做什么。</h2>
            <ol>
              {project.details.tradeoffs.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </FadeIn>
          <FadeIn className="case-column case-column--blue" y={36} delay={0.12}>
            <span>03 / IMPLEMENTATION</span>
            <h2>把判断变成可以运行的系统。</h2>
            <ol>
              {project.details.implementation.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </FadeIn>
        </section>

        <section className="case-evidence">
          <header>
            <span>04 / EVIDENCE</span>
            <h2>证据不是装饰数字。</h2>
          </header>
          <div>
            {evidence.map((item, index) => (
              <article key={item.id}>
                <span>0{index + 1}</span>
                <h3>{item.detail}</h3>
                <p>
                  {item.framework ?? '项目验收'}
                  {item.verifiedAt ? ` · 最近核验于 ${item.verifiedAt}` : ''}
                </p>
                {item.boundary ? <small>{item.boundary}</small> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="case-boundary">
          <span>05 / BOUNDARY</span>
          <h2>{project.details.boundary}</h2>
          <div>
            {project.github ? (
              <a href={project.github} target="_blank" rel="noopener noreferrer">
                查看 GitHub ↗
              </a>
            ) : (
              <p>当前没有公开仓库，以公开案例中的已核验事实为准。</p>
            )}
            <a href={homeUrl}>继续浏览作品集 →</a>
          </div>
        </section>
      </main>
    </div>
  )
}
