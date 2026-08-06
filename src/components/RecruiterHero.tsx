import { useEffect, useState } from 'react'
import { publicContent } from '../data/content'
import siteCopy from '../data/siteCopy.json'
import { assetPath } from '../utils/assets'
import { CircularText } from './CircularText'
import { Magnet } from './Magnet'
import { SideRays } from './SideRays'

interface RecruiterHeroProps {
  resumePath: string
}

export type LabState = 'slumber' | 'wake'

export function RecruiterHero({ resumePath }: RecruiterHeroProps) {
  const [labState, setLabState] = useState<LabState>('slumber')
  const [heroReady, setHeroReady] = useState(false)
  const [wakeImageRequested, setWakeImageRequested] = useState(false)
  const [wakeImageReady, setWakeImageReady] = useState(false)
  const [labAnnouncement, setLabAnnouncement] = useState('')
  const isWake = labState === 'wake'

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHeroReady(true))
    let preloadTimer = 0

    const requestWakeImage = () => {
      preloadTimer = window.setTimeout(() => setWakeImageRequested(true), 1200)
    }

    if (document.readyState === 'complete') requestWakeImage()
    else window.addEventListener('load', requestWakeImage, { once: true })

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(preloadTimer)
      window.removeEventListener('load', requestWakeImage)
    }
  }, [])

  const toggleLabState = () => {
    const nextState: LabState = isWake ? 'slumber' : 'wake'
    if (nextState === 'wake') setWakeImageRequested(true)
    setLabState(nextState)
    setLabAnnouncement(
      nextState === 'wake'
        ? '睡醒实验室已开启'
        : '睡醒实验室已进入待机状态',
    )
  }

  return (
    <section
      className={`hero-stage is-${labState}${heroReady ? ' is-ready' : ''}${wakeImageReady ? ' is-wake-image-ready' : ''}`}
      id="top"
      aria-labelledby="hero-name"
      data-lab-state={labState}
      data-wake-image-ready={wakeImageReady}
    >
      <div className="hero-stage__copy">
        <p className="hero-stage__eyebrow">{siteCopy.brandEyebrow}</p>
        <h1 id="hero-name">{publicContent.profile.name}</h1>
        <p className="hero-stage__role">{publicContent.profile.role}</p>
        <p className="hero-stage__tagline">{siteCopy.heroTagline}</p>
        <div className="hero-stage__status" aria-label="求职状态">
          {siteCopy.heroStatus.map((line) => <p key={line}>{line}</p>)}
        </div>

        <div className="hero-actions" aria-label="主要行动">
          <a className="button button--primary specular-surface" data-specular href="#job-assistant">
            查看核心项目
          </a>
          <a className="button button--secondary specular-surface" data-specular href={resumePath} target="_blank" rel="noopener noreferrer">
            查看综合简历
          </a>
          <a className="button button--secondary specular-surface" data-specular href="#contact">
            联系我
          </a>
        </div>

        <nav className="hero-secondary-links" aria-label="次级入口">
          <a href="#focus">切换求职方向</a>
          <a
            href={resumePath}
            download="杨皓博_AI产品与应用工程_公开简历.pdf"
            aria-label="下载 PDF"
          >
            下载 PDF
          </a>
          <a href={publicContent.profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
      </div>

      <div className="hero-stage__visual">
        <Magnet className="hero-stage__magnet" padding={180} strength={26}>
          <picture
            className="hero-stage__media hero-stage__media--sleep"
            aria-hidden={isWake && wakeImageReady}
          >
            <source
              type="image/webp"
              srcSet={`${assetPath('cover/slumber-sleep-768.webp')} 768w, ${assetPath('cover/slumber-sleep-1280.webp')} 1280w, ${assetPath('cover/slumber-sleep-1672.webp')} 1672w`}
              sizes="(max-width: 767px) 100vw, 45vw"
            />
            <img
              src={assetPath('cover/slumber-sleep-1672.webp')}
              alt="角色戴着睡帽在深色卧室的床上安静入睡"
              width="1672"
              height="941"
              decoding="async"
              fetchPriority="high"
            />
          </picture>
          {wakeImageRequested && (
            <picture
              className="hero-stage__media hero-stage__media--wake"
              aria-hidden={!isWake || !wakeImageReady}
            >
              <source
                type="image/webp"
                srcSet={`${assetPath('cover/slumber-wake-transition-768.webp')} 768w, ${assetPath('cover/slumber-wake-transition-1280.webp')} 1280w, ${assetPath('cover/slumber-wake-transition-1672.webp')} 1672w`}
                sizes="(max-width: 767px) 100vw, 45vw"
              />
              <img
                src={assetPath('cover/slumber-wake-transition-1672.webp')}
                alt="角色从昏暗睡眠空间伸懒腰走向明亮创作工作台"
                width="1672"
                height="941"
                decoding="async"
                fetchPriority="low"
                onLoad={() => setWakeImageReady(true)}
              />
            </picture>
          )}
        </Magnet>
        <SideRays
          className={`hero-stage__rays${isWake ? ' is-wake' : ''}`}
          speed={0.18}
          rayColor1="#f6d69a"
          rayColor2="#79aeca"
          intensity={0.72}
          spread={1.2}
          origin="top-right"
          tilt={-10}
          saturation={0.72}
          blend={0.28}
          falloff={1.62}
          opacity={0.56}
        />
        <div className="hero-stage__shade" aria-hidden="true" />
        <Magnet className="hero-orbit" padding={80} strength={6}>
          <CircularText
            text="SLUMBER*WAKE*LAB*"
            spinDuration={isWake ? 28 : 240}
            onHover={isWake ? 'speedUp' : 'pause'}
          />
          <strong aria-hidden="true">S/W</strong>
        </Magnet>
        <div className="hero-lab-control">
          <div className="hero-lab-status" aria-hidden="true">
            <span className="hero-lab-status__dot" />
            <span>
              <strong>STATUS / {isWake ? 'WAKE' : 'SLUMBER'}</strong>
              <small>{isWake ? '实验室已开启' : '实验室待机中'}</small>
            </span>
          </div>
          <button
            className="hero-wake"
            type="button"
            aria-pressed={isWake}
            aria-label={isWake ? '让睡醒实验室进入待机状态' : '唤醒睡醒实验室'}
            onClick={toggleLabState}
          >
            <span aria-hidden="true">{isWake ? '●' : '○'}</span>
            {isWake ? '让实验室入睡' : '唤醒实验室'}
          </button>
          <span
            className="hero-lab-announcement"
            aria-live="polite"
            aria-atomic="true"
          >
            {labAnnouncement}
          </span>
        </div>
      </div>

      <ul className="hero-capabilities" aria-label="核心能力">
        {siteCopy.capabilities.map((capability) => <li key={capability}>{capability}</li>)}
      </ul>
    </section>
  )
}
