import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useReducedMotion } from 'motion/react'
import './PillNav.css'

type GsapApi = typeof import('gsap').gsap
type GsapTimeline = ReturnType<GsapApi['timeline']>
type GsapTween = ReturnType<GsapTimeline['tweenTo']>

export interface PillNavItem {
  label: string
  href: string
  ariaLabel?: string
}

interface PillNavProps {
  items: PillNavItem[]
  activeHref?: string
  className?: string
  ease?: string
  baseColor?: string
  pillColor?: string
  hoveredPillTextColor?: string
  pillTextColor?: string
  initialLoadAnimation?: boolean
}

type PillNavStyle = CSSProperties & Record<`--${string}`, string>

export function PillNav({
  items,
  activeHref,
  className = '',
  ease = 'power3.out',
  baseColor = '#d7e2ea',
  pillColor = '#111820',
  hoveredPillTextColor = '#111820',
  pillTextColor,
  initialLoadAnimation = true,
}: PillNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const reduceMotion = useReducedMotion()
  const circleRefs = useRef<Array<HTMLSpanElement | null>>([])
  const timelineRefs = useRef<Array<GsapTimeline | null>>([])
  const tweenRefs = useRef<Array<GsapTween | null>>([])
  const navItemsRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let disposed = false
    let layout = () => undefined
    const timelines = timelineRefs.current
    const tweens = tweenRefs.current

    const initialize = async () => {
      const { gsap } = await import('gsap')
      if (disposed) return

      layout = () => {
        circleRefs.current.forEach((circle, index) => {
          if (!circle?.parentElement) return

          const pill = circle.parentElement
          const { width, height } = pill.getBoundingClientRect()
          const radius = ((width * width) / 4 + height * height) / (2 * height)
          const diameter = Math.ceil(2 * radius) + 2
          const delta = Math.ceil(
            radius - Math.sqrt(Math.max(0, radius * radius - (width * width) / 4)),
          ) + 1
          const originY = diameter - delta
          const label = pill.querySelector<HTMLElement>('.pill-label')
          const hoverLabel = pill.querySelector<HTMLElement>('.pill-label-hover')

          timelineRefs.current[index]?.kill()
          gsap.set(circle, {
            width: diameter,
            height: diameter,
            bottom: -delta,
            xPercent: -50,
            scale: 0,
            transformOrigin: `50% ${originY}px`,
          })
          if (label) gsap.set(label, { y: 0 })
          if (hoverLabel) gsap.set(hoverLabel, { y: height + 12, opacity: 0 })

          if (reduceMotion) return
          const timeline = gsap.timeline({ paused: true })
          timeline.to(circle, { scale: 1.2, duration: 0.8, ease }, 0)
          if (label) timeline.to(label, { y: -(height + 8), duration: 0.8, ease }, 0)
          if (hoverLabel) {
            timeline.to(hoverLabel, { y: 0, opacity: 1, duration: 0.8, ease }, 0)
          }
          timelineRefs.current[index] = timeline
        })
      }

      layout()
      window.addEventListener('resize', layout)
      void document.fonts?.ready.then(layout).catch(() => undefined)

      if (initialLoadAnimation && navItemsRef.current && !reduceMotion) {
        gsap.fromTo(
          navItemsRef.current,
          { opacity: 0, y: -10, scaleX: 0.88 },
          { opacity: 1, y: 0, scaleX: 1, duration: 0.55, ease, transformOrigin: 'center' },
        )
      }
    }

    void initialize()

    return () => {
      disposed = true
      window.removeEventListener('resize', layout)
      timelines.forEach((timeline) => timeline?.kill())
      tweens.forEach((tween) => tween?.kill())
    }
  }, [ease, initialLoadAnimation, items, reduceMotion])

  useEffect(() => {
    if (!isMobileMenuOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsMobileMenuOpen(false)
      hamburgerRef.current?.focus()
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isMobileMenuOpen])

  const handleEnter = (index: number) => {
    const timeline = timelineRefs.current[index]
    if (!timeline || reduceMotion) return
    tweenRefs.current[index]?.kill()
    tweenRefs.current[index] = timeline.tweenTo(timeline.duration(), {
      duration: 0.28,
      ease,
      overwrite: 'auto',
    })
  }

  const handleLeave = (index: number) => {
    const timeline = timelineRefs.current[index]
    if (!timeline || reduceMotion) return
    tweenRefs.current[index]?.kill()
    tweenRefs.current[index] = timeline.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: 'auto',
    })
  }

  const cssVariables: PillNavStyle = {
    '--pill-base': baseColor,
    '--pill-bg': pillColor,
    '--pill-hover-text': hoveredPillTextColor,
    '--pill-text': pillTextColor ?? baseColor,
  }

  return (
    <div className={`pill-nav-container ${className}`.trim()} style={cssVariables}>
      <nav className="pill-nav" aria-label="页面导航">
        <div className="pill-nav-items" ref={navItemsRef}>
          <ul className="pill-list">
            {items.map((item, index) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`pill${activeHref === item.href ? ' is-active' : ''}`}
                  aria-label={item.ariaLabel ?? item.label}
                  onMouseEnter={() => handleEnter(index)}
                  onMouseLeave={() => handleLeave(index)}
                  onFocus={() => handleEnter(index)}
                  onBlur={() => handleLeave(index)}
                >
                  <span
                    className="hover-circle"
                    aria-hidden="true"
                    ref={(element) => { circleRefs.current[index] = element }}
                  />
                  <span className="label-stack">
                    <span className="pill-label">{item.label}</span>
                    <span className="pill-label-hover" aria-hidden="true">{item.label}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <button
          className="mobile-menu-button"
          type="button"
          aria-label={isMobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-primary-menu"
          onClick={() => setIsMobileMenuOpen((value) => !value)}
          ref={hamburgerRef}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </nav>

      <div
        id="mobile-primary-menu"
        className="mobile-menu-popover"
        data-open={isMobileMenuOpen}
        ref={mobileMenuRef}
      >
        <ul>
          {items.map((item) => (
            <li key={`mobile-${item.href}`}>
              <a
                href={item.href}
                className={activeHref === item.href ? 'is-active' : ''}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
