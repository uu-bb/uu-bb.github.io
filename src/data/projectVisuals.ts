interface ProjectVisual {
  src: string
  alt: string
}

const projectVisuals: Record<string, ProjectVisual> = {
  'job-assistant': {
    src: 'editorial/job-assistant-scene.webp',
    alt: '左侧是分散的岗位资料，中间是创作者在电脑前整理信息，右侧是完成排序、检查和人工确认的岗位卡片',
  },
  'rag-knowledge-base': {
    src: 'editorial/rag-knowledge-scene.webp',
    alt: '左侧是本地文档来源，中间是混合检索装置，右侧是带引用来源的回答卡片',
  },
}

export function getProjectVisual(projectId: string): ProjectVisual | null {
  return projectVisuals[projectId] ?? null
}
