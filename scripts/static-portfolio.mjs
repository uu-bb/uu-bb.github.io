import siteCopy from '../src/data/siteCopy.json' with { type: 'json' }

const coreProjectIds = ['job-assistant', 'xiaoyu', 'rag-knowledge-base']
const siteUrl = 'https://uu-bb.github.io/'
const resumePath = '/resume/yang-haobo-ai-product-application.pdf'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getCoreProjects(content) {
  const projects = new Map(content.projects.map((project) => [project.id, project]))
  return coreProjectIds.map((id) => projects.get(id)).filter(Boolean)
}

function getEvidence(content, project) {
  const evidence = new Map(content.evidence.map((item) => [item.id, item]))
  return project.evidenceIds.map((id) => evidence.get(id)).find(Boolean)
}

export function renderStaticPortfolio(content) {
  const projects = getCoreProjects(content)
  const capabilities = siteCopy.capabilities
    .map((capability) => `<li>${escapeHtml(capability)}</li>`)
    .join('')
  const projectCards = projects.map((project) => {
    const evidence = getEvidence(content, project)
    const evidenceMeta = [evidence?.framework, evidence?.verifiedAt]
      .filter(Boolean)
      .map(escapeHtml)
      .join(' · ')

    return `<article>
      <h3>${escapeHtml(project.title)}</h3>
      <p>${escapeHtml(project.problem)}</p>
      ${evidence ? `<p><strong>${escapeHtml(evidence.detail)}</strong></p>` : ''}
      ${evidenceMeta ? `<p>${evidenceMeta}</p>` : ''}
      <a href="/?project=${encodeURIComponent(project.id)}&amp;focus=overview">查看对应项目</a>
    </article>`
  }).join('')

  return `<main class="static-portfolio">
    <header>
      <p class="static-portfolio__eyebrow">${escapeHtml(siteCopy.brandEyebrow)}</p>
      <h1>${escapeHtml(content.profile.name)}</h1>
      <p class="static-portfolio__role">${escapeHtml(content.profile.role)}</p>
      <p>${escapeHtml(siteCopy.heroTagline)}</p>
      <p>${escapeHtml(siteCopy.heroStatus.join(' · '))}</p>
    </header>
    <section aria-labelledby="static-capabilities-title">
      <h2 id="static-capabilities-title">核心能力</h2>
      <ul>${capabilities}</ul>
    </section>
    <section aria-labelledby="static-projects-title">
      <h2 id="static-projects-title">核心项目与证据</h2>
      <div class="static-portfolio__projects">${projectCards}</div>
    </section>
    <footer>
      <p>${escapeHtml(siteCopy.contactHeadline)}</p>
      <a href="${resumePath}">查看综合简历</a>
      <a href="mailto:${escapeHtml(content.profile.email)}">${escapeHtml(content.profile.email)}</a>
      <a href="${escapeHtml(content.profile.github)}">GitHub</a>
    </footer>
  </main>`
}

export function renderStructuredData(content) {
  const projects = getCoreProjects(content)
  const graph = [
    {
      '@type': 'Person',
      '@id': `${siteUrl}#person`,
      name: content.profile.name,
      url: siteUrl,
      jobTitle: content.profile.role,
      sameAs: [content.profile.github],
      knowsAbout: siteCopy.capabilities,
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      url: siteUrl,
      name: `${content.profile.name} · ${content.profile.role}作品集`,
      inLanguage: 'zh-CN',
      author: { '@id': `${siteUrl}#person` },
    },
    {
      '@type': 'ItemList',
      '@id': `${siteUrl}#core-projects`,
      name: '核心项目',
      itemListElement: projects.map((project, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CreativeWork',
          name: project.title,
          description: project.problem,
          url: `${siteUrl}?project=${encodeURIComponent(project.id)}`,
          creator: { '@id': `${siteUrl}#person` },
        },
      })),
    },
  ]

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    .replaceAll('<', '\\u003c')
}
