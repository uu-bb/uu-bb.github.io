interface ProjectVisual {
  src: string
  alt: string
}

const projectVisuals: Record<string, ProjectVisual> = {
  'job-assistant': {
    src: 'editorial/job-assistant-scene.webp',
    alt: '左侧是分散的岗位资料，中间是创作者在电脑前整理信息，右侧是完成排序、检查和人工确认的岗位卡片',
  },
  xiaoyu: {
    src: 'editorial/xiaoyu-scene.webp',
    alt: '左侧是专注工作的学生，右侧是小u鱼桌宠用计时、提醒和锁定功能提供低打扰陪伴',
  },
  'rag-knowledge-base': {
    src: 'editorial/rag-knowledge-scene.webp',
    alt: '左侧是本地文档来源，中间是混合检索装置，右侧是带引用来源的回答卡片',
  },
}

const fallbackVisual: ProjectVisual = projectVisuals['job-assistant']

export function getProjectVisual(projectId: string): ProjectVisual {
  return projectVisuals[projectId] ?? fallbackVisual
}
