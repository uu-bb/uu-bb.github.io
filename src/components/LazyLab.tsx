import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import { evidenceById, projectById } from '../data/content'
import type { RoleLens } from '../data/types'
import { assetPath } from '../utils/assets'

const ThreeScene = lazy(() => import('./ThreeScene'))

const labGuides: Array<{
  label: string
  projectId: string
  focus: RoleLens
  viewpoint: string
}> = [
  {
    label: '产品判断',
    projectId: 'xiaoyu',
    focus: 'product',
    viewpoint: '从使用场景、MVP 取舍和安全边界理解一个陪伴产品。',
  },
  {
    label: 'RAG 系统',
    projectId: 'rag-knowledge-base',
    focus: 'ai-app',
    viewpoint: '沿着解析、检索、重排、来源与降级路径阅读完整链路。',
  },
  {
    label: 'Agent 工作流',
    projectId: 'agent-toolkit',
    focus: 'ai-app',
    viewpoint: '观察确定性规则、结构化输出和模型建议层如何分工。',
  },
  {
    label: '后端交付',
    projectId: 'job-assistant',
    focus: 'python',
    viewpoint: '从接口、状态、人工确认与测试证据审视真实交付。',
  },
]

class SceneBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The static poster remains visible; no private diagnostics are emitted.
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function Poster() {
  return (
    <img
      className="lab-poster"
      src={assetPath('character/sleepy-boy-3d-poster.webp')}
      alt="睡眼角色静态预览"
      loading="lazy"
      width="640"
      height="853"
    />
  )
}

export function LazyLab() {
  const sectionRef = useRef<HTMLElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedGuideIndex, setSelectedGuideIndex] = useState(0)
  const selectedGuide = labGuides[selectedGuideIndex]
  const selectedProject = projectById.get(selectedGuide.projectId)
  const selectedEvidence = selectedProject?.evidenceIds
    .map((id) => evidenceById.get(id))
    .find((item) => item !== undefined)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    setIsMobile(media.matches)
    const update = () => setIsMobile(media.matches)
    media.addEventListener('change', update)

    if (
      !media.matches &&
      sectionRef.current &&
      typeof window.IntersectionObserver !== 'undefined'
    ) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setEnabled(true)
            observer.disconnect()
          }
        },
        { rootMargin: '160px' },
      )
      observer.observe(sectionRef.current)
      return () => {
        observer.disconnect()
        media.removeEventListener('change', update)
      }
    }

    return () => media.removeEventListener('change', update)
  }, [])

  const fallback = <Poster />

  return (
    <section className="section lab-section" id="lab" ref={sectionRef}>
      <div className="section-heading section-heading--light">
        <p className="eyebrow">P3 · 非阻塞增强</p>
        <h2>3D 作品导览台</h2>
        <p>角色负责让人记住，右侧导览负责把能力带回真实项目与核验证据。</p>
      </div>

      <div className="lab-frame">
        <div className="lab-frame__meta">
          <span>INTERACTIVE MODEL / PROJECT GUIDE</span>
          <span>GLB LAZY LOADED</span>
        </div>
        <div className="lab-workbench">
          <div className="lab-viewer">
            <div className="lab-viewport">
              {enabled ? (
                <SceneBoundary fallback={fallback}>
                  <Suspense fallback={fallback}>
                    <ThreeScene />
                  </Suspense>
                </SceneBoundary>
              ) : (
                fallback
              )}
            </div>
            {isMobile && !enabled ? (
              <button className="lab-enable" type="button" onClick={() => setEnabled(true)}>
                加载可交互 3D
              </button>
            ) : null}
          </div>

          <aside className="lab-guide" aria-labelledby="lab-guide-title">
            <div className="lab-guide__heading">
              <span>CAPABILITY ROUTER / 04</span>
              <h3 id="lab-guide-title">你想从哪个角度认识我的作品？</h3>
            </div>
            <div className="lab-guide__options" role="group" aria-label="选择能力导览">
              {labGuides.map((guide, index) => (
                <button
                  key={guide.label}
                  type="button"
                  className={`${selectedGuideIndex === index ? 'is-active ' : ''}specular-surface`}
                  data-specular
                  aria-pressed={selectedGuideIndex === index}
                  onClick={() => setSelectedGuideIndex(index)}
                >
                  <span>0{index + 1}</span>
                  {guide.label}
                </button>
              ))}
            </div>

            {selectedProject ? (
              <div className="lab-guide__project" aria-live="polite">
                <div>
                  <span>{selectedProject.statusLabel}</span>
                  <span>{selectedGuide.focus.toUpperCase()}</span>
                </div>
                <h4>{selectedProject.title}</h4>
                <p>{selectedGuide.viewpoint}</p>
                <dl>
                  <div>
                    <dt>关键实现</dt>
                    <dd>{selectedProject.keyImplementation}</dd>
                  </div>
                  {selectedEvidence ? (
                    <div>
                      <dt>核验证据</dt>
                      <dd>
                        {selectedEvidence.label}
                        {selectedEvidence.framework ? ` · ${selectedEvidence.framework}` : ''}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <div className="lab-guide__tags" aria-label="项目技术标签">
                  {selectedProject.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
                </div>
                <a
                  className="specular-surface"
                  data-specular
                  href={`/?project=${selectedProject.id}&focus=${selectedGuide.focus}`}
                >
                  进入项目讲解 ↗
                </a>
              </div>
            ) : null}
          </aside>
        </div>
        <p className="lab-note">
          首屏不请求模型。移动端默认静态图；即使 WebGL 不可用，项目导览仍可完整使用。
        </p>
      </div>
    </section>
  )
}
