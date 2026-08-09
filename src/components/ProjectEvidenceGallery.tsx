import type { EvidenceMedia, EvidenceMediaType, ProjectCase } from '../data/types'
import { assetPath } from '../utils/assets'

const categoryLabels: Record<EvidenceMediaType, string> = {
  'runtime-screenshot': '真实运行证据',
  'concept-visual': '概念视觉',
  architecture: '系统架构',
  'test-evidence': '自动化测试证据',
}

const ragEvidenceTitles: Record<string, string> = {
  'rag-query-with-sources': '证据 01 · 查询与来源',
  'rag-no-match-fallback': '证据 02 · 无匹配降级',
  'rag-knowledge-status': '证据 03 · 索引状态',
}

function getOriginalImageLabel(project: ProjectCase, item: EvidenceMedia): string {
  const subject = project.id === 'xiaoyu'
    ? categoryLabels[item.type]
    : item.proofStatement.replace(/^证明/, '').replace(/[。；]$/, '')
  return `查看“${subject}”原图`
}

interface ProjectEvidenceGalleryProps {
  project: ProjectCase
  media: EvidenceMedia[]
}

export function ProjectEvidenceGallery({
  project,
  media,
}: ProjectEvidenceGalleryProps) {
  if (media.length === 0) return null

  const isRuntimeGallery = media.every((item) => item.type === 'runtime-screenshot')
  const heading = isRuntimeGallery ? '真实运行证据' : '公开证据'
  const headingId = `${project.id}-public-evidence-title`

  return (
    <section
      className="case-media-evidence"
      aria-labelledby={headingId}
      tabIndex={0}
    >
      <header className="case-media-evidence__heading">
        <span>PUBLIC PROOF / APPROVED MEDIA</span>
        <h3 id={headingId}>{heading}</h3>
        {project.id === 'xiaoyu' ? <p>本地双角色长期陪伴系统</p> : null}
      </header>

      <div className="case-media-evidence__grid">
        {media.map((item) => (
          <figure
            className="case-media-evidence__item"
            data-evidence-id={item.id}
            data-evidence-type={item.type}
            key={item.id}
          >
            {project.id === 'rag-knowledge-base' ? (
              <p className="case-media-evidence__marker">
                {ragEvidenceTitles[item.id]}
              </p>
            ) : null}
            <div className="case-media-evidence__image">
              <img
                src={assetPath(item.src)}
                alt={item.alt}
                width={item.width}
                height={item.height}
                loading="lazy"
                decoding="async"
              />
            </div>
            <figcaption>
              <span className="case-media-evidence__category">
                {project.id === 'rag-knowledge-base' && item.type === 'runtime-screenshot'
                  ? 'Lite 实际运行证据'
                  : categoryLabels[item.type]}
              </span>
              <h4>{item.proofStatement}</h4>
              <p>{item.caption}</p>
              <p className="case-media-evidence__verified">
                最近核验于 <time dateTime={item.verifiedAt}>{item.verifiedAt}</time>
              </p>
              <p className="case-media-evidence__boundary">{item.boundary}</p>
              <a
                className="case-media-evidence__original specular-surface"
                data-specular
                href={assetPath(item.src)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={getOriginalImageLabel(project, item)}
              >
                查看原图 ↗
              </a>
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="case-media-evidence__project-boundary">{project.details.boundary}</p>
    </section>
  )
}
