import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { publicContent } from '../data/content'
import { assetPath } from '../utils/assets'

const imageTiles = [
  {
    src: 'editorial/job-assistant-scene.webp',
    alt: '深圳 AI 求职助手从分散岗位输入到整理确认的微场景',
  },
  {
    src: 'cover/slumber-wake-transition-1280.webp',
    alt: '睡眠与醒来之间的角色主视觉',
  },
  {
    src: 'editorial/experiments-workbench.webp',
    alt: '从试验工作台到验证归档架的微场景',
  },
]

export function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const firstRowRef = useRef<HTMLDivElement>(null)
  const secondRowRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const labels = [
    ...publicContent.projects.slice(0, 3).map((project) => project.title),
    ...publicContent.evidence.slice(0, 3).map((evidence) => evidence.label),
    'RAG · AGENT · FASTAPI · PRODUCT',
  ]

  useEffect(() => {
    if (reduceMotion) return

    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const section = sectionRef.current
        const firstRow = firstRowRef.current
        const secondRow = secondRowRef.current
        if (!section || !firstRow || !secondRow) return

        const sectionTop = section.getBoundingClientRect().top + window.scrollY
        const offset = (window.scrollY - sectionTop + window.innerHeight) * 0.28
        firstRow.style.transform = `translate3d(${offset - 240}px, 0, 0)`
        secondRow.style.transform = `translate3d(${-offset + 80}px, 0, 0)`
      })
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [reduceMotion])

  return (
    <section className="marquee-section" ref={sectionRef} aria-label="项目与证据胶片">
      <div className="marquee-row marquee-row--text" ref={firstRowRef}>
        {Array.from({ length: 3 }, (_, repeatIndex) =>
          labels.map((label, index) => (
            <span key={`${repeatIndex}-${index}-${label}`} aria-hidden={repeatIndex > 0}>
              {label}
            </span>
          )),
        )}
      </div>
      <div className="marquee-row marquee-row--images" ref={secondRowRef}>
        {Array.from({ length: 3 }, (_, repeatIndex) =>
          imageTiles.map((tile, index) => (
            <figure key={`${repeatIndex}-${tile.src}`} aria-hidden={repeatIndex > 0}>
              <img
                src={assetPath(tile.src)}
                alt={repeatIndex === 0 ? tile.alt : ''}
                width="1280"
                height="853"
                loading="lazy"
              />
              <figcaption>FRAME 0{index + 1}</figcaption>
            </figure>
          )),
        )}
      </div>
    </section>
  )
}
