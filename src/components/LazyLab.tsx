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
import { assetPath } from '../utils/assets'

const ThreeScene = lazy(() => import('./ThreeScene'))

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
        <h2>3D 实验室</h2>
        <p>网站先讲清能力，角色负责让人记住。拖动查看当前静态模型。</p>
      </div>

      <div className="lab-frame">
        <div className="lab-frame__meta">
          <span>WEB GLB / OPTIMIZED</span>
          <span>152,352 TRIANGLES</span>
        </div>
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
        <p className="lab-note">
          首屏不请求模型。移动端默认静态图，WebGL 不可用时仍可完整浏览作品集。
        </p>
      </div>
    </section>
  )
}
