import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import type { EvidenceRecord, ProjectCase, RoleLens } from '../data/types'
import { getProjectVisual } from '../data/projectVisuals'
import { assetPath } from '../utils/assets'

interface ProjectShowcaseCardProps {
  project: ProjectCase
  evidence: EvidenceRecord[]
  index: number
  total: number
  lens: RoleLens
}

const lensLabels: Record<RoleLens, string> = {
  overview: '产品判断 × 工程交付',
  product: '场景 × 范围 × 验收',
  'ai-app': 'RAG × Agent × 工作流',
  python: '接口 × 状态 × 可靠性',
}

export function ProjectShowcaseCard({
  project,
  evidence,
  index,
  total,
  lens,
}: ProjectShowcaseCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })
  const targetScale = 1 - (total - 1 - index) * 0.035
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale])
  const detailUrl = `/?project=${encodeURIComponent(project.id)}&focus=${lens}`
  const visual = getProjectVisual(project.id)

  return (
    <div className="stack-card-space" ref={containerRef}>
      <motion.article
        className={`stack-project stack-project--${index + 1} specular-surface`}
        data-specular
        style={{
          scale: reduceMotion ? 1 : scale,
          top: `${88 + index * 24}px`,
        }}
      >
        <header className="stack-project__header">
          <span className="stack-project__number">0{index + 1}</span>
          <div>
            <p>{lensLabels[lens]}</p>
            <span>{project.statusLabel}</span>
          </div>
          <h3>{project.title}</h3>
          <a className="specular-surface" data-specular href={detailUrl}>阅读案例 ↗</a>
        </header>

        <div className="stack-project__body">
          <div className="stack-project__copy">
            <p className="stack-project__role">{project.role}</p>
            <p className="stack-project__problem">{project.problem}</p>

            <div className="stack-project__implementation">
              <span>KEY IMPLEMENTATION</span>
              <p>{project.keyImplementation}</p>
            </div>

            <ul aria-label={`${project.title}证据`}>
              {evidence.slice(0, 2).map((item) => (
                <li key={item.id}>
                  <strong>{item.label}</strong>
                  {item.framework ? <span> · {item.framework}</span> : null}
                </li>
              ))}
            </ul>

            <div className="stack-project__tags">
              {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </div>

          <figure className="stack-project__visual">
            <img
              src={assetPath(visual.src)}
              alt={visual.alt}
              width="1280"
              height="853"
              loading="lazy"
            />
          </figure>
        </div>
      </motion.article>
    </div>
  )
}
