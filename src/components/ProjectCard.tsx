import { useRef, type KeyboardEvent } from 'react'
import type { EvidenceRecord, ProjectCase, RoleLens } from '../data/types'

interface ProjectCardProps {
  project: ProjectCase
  evidence: EvidenceRecord[]
  index: number
  isOpen: boolean
  lens: RoleLens
  onToggle: (projectId: string, shouldOpen: boolean) => void
}

const lensFocus: Record<RoleLens, string> = {
  overview: '产品判断 × 工程交付',
  product: '场景、MVP、验收与边界',
  'ai-app': 'RAG、Agent 与工作流闭环',
  python: '接口、状态与自动化可靠性',
}

const tagPriority: Record<RoleLens, string[]> = {
  overview: [],
  product: ['产品', 'Agent'],
  'ai-app': ['RAG', 'Agent', 'LangGraph', 'FastAPI'],
  python: ['Python', 'FastAPI', 'SQLite', 'Playwright'],
}

export function ProjectCard({
  project,
  evidence,
  index,
  isOpen,
  lens,
  onToggle,
}: ProjectCardProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const orderedTags = [...project.tags].sort((left, right) => {
    const rank = (tag: string) => {
      const match = tagPriority[lens].findIndex((token) => tag.includes(token))
      return match === -1 ? Number.POSITIVE_INFINITY : match
    }
    return rank(left) - rank(right)
  })

  const closeAndRestoreFocus = () => {
    onToggle(project.id, false)
    requestAnimationFrame(() => buttonRef.current?.focus())
  }

  const handleDetailKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeAndRestoreFocus()
    }
  }

  return (
    <article className={`project-card${isOpen ? ' is-open' : ''}`} id={project.id}>
      <div className="project-card__topline">
        <span className="project-card__index">0{index + 1}</span>
        <span className={`status status--${project.status}`}>{project.statusLabel}</span>
      </div>

      <div className="project-card__body">
        <div>
          <p className="eyebrow">{project.role}</p>
          <p className="project-card__lens">本视角重点 · {lensFocus[lens]}</p>
          <h3>{project.title}</h3>
        </div>
        <p className="project-card__problem">{project.problem}</p>

        <div className="project-card__implementation">
          <span>关键实现</span>
          <p>{project.keyImplementation}</p>
        </div>

        <ul className="evidence-list" aria-label={`${project.title}证据`}>
          {evidence.slice(0, 2).map((item) => (
            <li key={item.id}>
              <strong>{item.label}</strong>
              {item.framework ? <span> · {item.framework}</span> : null}
            </li>
          ))}
        </ul>

        <div className="tag-list tag-list--emphasis" aria-label={`${project.title}技术标签`}>
          {orderedTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>

      <button
        ref={buttonRef}
        className="project-card__toggle"
        type="button"
        aria-label={isOpen ? `收起${project.title}详情` : `展开${project.title}详情`}
        aria-expanded={isOpen}
        aria-controls={`project-detail-${project.id}`}
        onClick={() =>
          isOpen ? closeAndRestoreFocus() : onToggle(project.id, true)
        }
      >
        <span>{isOpen ? '收起案例' : '查看完整案例'}</span>
        <span aria-hidden="true">{isOpen ? '−' : '↗'}</span>
      </button>

      {isOpen ? (
        <div
          className="project-detail"
          id={`project-detail-${project.id}`}
          onKeyDown={handleDetailKeyDown}
        >
          <div>
            <p className="detail-label">问题</p>
            <h4 tabIndex={-1} id={`project-detail-title-${project.id}`}>
              {project.details.problem}
            </h4>
          </div>

          <div className="detail-grid">
            <section>
              <p className="detail-label">取舍</p>
              <ul>
                {project.details.tradeoffs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section>
              <p className="detail-label">实现</p>
              <ul>
                {project.details.implementation.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <div className="detail-evidence">
            <p className="detail-label">证据</p>
            {evidence.map((item) => (
              <div key={item.id}>
                <strong>{item.detail}</strong>
                {item.framework ? <span> · {item.framework}</span> : null}
                {item.verifiedAt ? (
                  <span> · 最近核验于 {item.verifiedAt}</span>
                ) : null}
                {item.boundary ? <p>{item.boundary}</p> : null}
              </div>
            ))}
          </div>

          <div className="detail-boundary">
            <p className="detail-label">边界</p>
            <p>{project.details.boundary}</p>
          </div>

          <div className="detail-actions">
            {project.github ? (
              <a href={project.github} target="_blank" rel="noopener noreferrer">
                查看 GitHub <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span>本地项目 · 暂无公开仓库</span>
            )}
            <button type="button" onClick={closeAndRestoreFocus}>
              关闭详情
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
}
