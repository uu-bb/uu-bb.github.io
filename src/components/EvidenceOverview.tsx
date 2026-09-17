import { evidenceById, projectById } from '../data/content'

const coreProjectIds = ['job-assistant', 'careerpilot', 'rag-knowledge-base']

export function EvidenceOverview() {
  const items = coreProjectIds.flatMap((projectId) => {
    const project = projectById.get(projectId)
    if (!project) return []
    const evidence = project.evidenceIds
      .map((evidenceId) => evidenceById.get(evidenceId))
      .find((item) => item !== undefined)
    return evidence ? [{ project, evidence }] : []
  })

  return (
    <section className="evidence-overview" aria-labelledby="evidence-overview-title">
      <header>
        <p className="section-kicker">VERIFIED / PUBLIC EVIDENCE</p>
        <h2 id="evidence-overview-title">核心项目证据</h2>
        <p>每条成果都写清了它能证明什么、以及它不证明什么。</p>
      </header>
      <div className="evidence-overview__grid">
        {items.map(({ project, evidence }, index) => (
          <a
            className="evidence-card specular-surface"
            data-specular
            href={`#${project.id}`}
            aria-label={`查看${project.title}`}
            key={evidence.id}
          >
            <span>0{index + 1} / {project.shortTitle}</span>
            <strong>{evidence.detail}</strong>
            <p>{evidence.framework ?? '成果已实现'}</p>
            {evidence.verifiedAt ? <time dateTime={evidence.verifiedAt}>最近核验：{evidence.verifiedAt}</time> : null}
            <small>查看对应项目 ↗</small>
          </a>
        ))}
      </div>
    </section>
  )
}
