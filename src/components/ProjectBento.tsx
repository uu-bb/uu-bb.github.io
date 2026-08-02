import { gsap } from 'gsap'
import { useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import type { ProjectCase } from '../data/types'
import './ProjectBento.css'

interface BentoItem {
  eyebrow: string
  title: string
  text?: string
  list?: string[]
}

const starPositions = [
  [17, 22, 0],
  [74, 18, 180],
  [88, 64, 360],
  [28, 76, 540],
] as const

function BentoCard({ item, index }: { item: BentoItem; index: number }) {
  const cardRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const animationsDisabled = reduceMotion || window.matchMedia('(max-width: 767px), (pointer: coarse)').matches

  useEffect(() => () => {
    if (cardRef.current) gsap.killTweensOf(cardRef.current)
  }, [])

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    card.style.setProperty('--glow-x', `${(x / rect.width) * 100}%`)
    card.style.setProperty('--glow-y', `${(y / rect.height) * 100}%`)
    if (animationsDisabled) return
    const rotateY = ((x - rect.width / 2) / rect.width) * 7
    const rotateX = ((rect.height / 2 - y) / rect.height) * 7
    gsap.to(card, {
      rotateX,
      rotateY,
      x: ((x - rect.width / 2) / rect.width) * 4,
      y: ((y - rect.height / 2) / rect.height) * 4,
      duration: 0.22,
      ease: 'power2.out',
      transformPerspective: 1200,
    })
  }

  const resetCard = () => {
    const card = cardRef.current
    if (!card || animationsDisabled) return
    gsap.to(card, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.34, ease: 'power2.out' })
  }

  const addRipple = (event: ReactPointerEvent<HTMLElement>) => {
    const card = cardRef.current
    if (!card || animationsDisabled) return
    const rect = card.getBoundingClientRect()
    const ripple = document.createElement('span')
    ripple.className = 'project-bento__ripple'
    ripple.style.left = `${event.clientX - rect.left - 11}px`
    ripple.style.top = `${event.clientY - rect.top - 11}px`
    card.appendChild(ripple)
    gsap.fromTo(
      ripple,
      { scale: 0, opacity: 1 },
      { scale: 22, opacity: 0, duration: 0.72, ease: 'power2.out', onComplete: () => ripple.remove() },
    )
  }

  return (
    <article
      ref={cardRef}
      className="project-bento__card specular-surface"
      data-specular
      onPointerMove={handlePointerMove}
      onPointerLeave={resetCard}
      onPointerDown={addRipple}
    >
      {starPositions.map(([x, y, delay]) => (
        <span
          className="project-bento__star"
          aria-hidden="true"
          key={`${x}-${y}`}
          style={{
            '--star-x': `${x}%`,
            '--star-y': `${y}%`,
            '--star-delay': `${delay + index * 70}ms`,
          } as CSSProperties}
        />
      ))}
      <header className="project-bento__card-header">
        <span>{String(index + 1).padStart(2, '0')}</span>
        <small>{item.eyebrow}</small>
      </header>
      <h3>{item.title}</h3>
      {item.text ? <p>{item.text}</p> : null}
      {item.list ? (
        <ul>{item.list.map((entry) => <li key={entry}>{entry}</li>)}</ul>
      ) : null}
    </article>
  )
}

export function ProjectBento({ project }: { project: ProjectCase }) {
  const items = useMemo<BentoItem[]>(() => [
    {
      eyebrow: 'UNDERSTANDING',
      title: '项目理解',
      text: project.details.problem,
    },
    {
      eyebrow: 'AUDIENCE',
      title: '面向对象',
      list: project.details.audience.slice(0, 3),
    },
    {
      eyebrow: 'USER FLOW',
      title: '任务怎样完成',
      list: project.details.userFlow,
    },
    {
      eyebrow: 'FUNCTIONS',
      title: '核心功能',
      list: project.details.features.slice(0, 4),
    },
    {
      eyebrow: 'ARCHITECTURE',
      title: '系统分工',
      list: project.details.architecture.slice(0, 4),
    },
    {
      eyebrow: 'BOUNDARY',
      title: '关键取舍与边界',
      text: project.details.boundary,
      list: project.details.tradeoffs.slice(0, 2),
    },
  ], [project])

  return (
    <section className="project-bento case-chapter" aria-labelledby="project-map-title">
      <header className="project-bento__heading">
        <span>CASE MAP / SIX QUESTIONS</span>
        <h2 id="project-map-title">先看懂，<br />再看细节。</h2>
        <p>这六张卡片是项目讲解的入口：它先回答为什么做、给谁用、怎样完成，再进入架构、代码、证据与失败边界。</p>
      </header>
      <div className="project-bento__grid">
        {items.map((item, index) => <BentoCard key={item.title} item={item} index={index} />)}
      </div>
    </section>
  )
}
