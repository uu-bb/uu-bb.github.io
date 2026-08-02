import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useReducedMotion } from 'motion/react'
import './OptionWheel.css'

interface OptionWheelProps {
  items: string[]
  defaultSelected?: number
  onChange?: (index: number, item: string) => void
  textColor?: string
  activeColor?: string
  side?: 'left' | 'right'
  fontSize?: number
  spacing?: number
  curve?: number
  tilt?: number
  blur?: number
  fade?: number
  minOpacity?: number
  smoothing?: number
  inset?: number
  loop?: boolean
  draggable?: boolean
  soundUrl?: string
  soundVolume?: number
  className?: string
  ariaLabel?: string
}

interface WheelConfig {
  count: number
  items: string[]
  rowHeight: number
  curve: number
  tilt: number
  blur: number
  fade: number
  minOpacity: number
  side: 'left' | 'right'
  loop: boolean
  smoothing: number
  draggable: boolean
  soundUrl: string
  soundVolume: number
}

interface DragState {
  y: number
  start: number
  pointerId: number
}

type WheelStyle = CSSProperties & Record<`--${string}`, string>

export function OptionWheel({
  items,
  defaultSelected = 0,
  onChange,
  textColor = '#0f5f83',
  activeColor = '#f4efe3',
  side = 'left',
  fontSize = 2.25,
  spacing = 1.25,
  curve = 0.9,
  tilt = 7,
  blur = 0.8,
  fade = 0.22,
  minOpacity = 0.14,
  smoothing = 170,
  inset = 16,
  loop = false,
  draggable = true,
  soundUrl = '',
  soundVolume = 0.35,
  className = '',
  ariaLabel = '选择联系目的',
}: OptionWheelProps) {
  const initialIndex = Math.min(Math.max(defaultSelected, 0), Math.max(items.length - 1, 0))
  const rootRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])
  const positionRef = useRef(initialIndex)
  const targetRef = useRef(initialIndex)
  const frameRef = useRef<number | null>(null)
  const lastFrameRef = useRef(0)
  const onChangeRef = useRef(onChange)
  const selectedRef = useRef(initialIndex)
  const wheelTimerRef = useRef<number | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const dragMovedRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef('')
  const lastTickRef = useRef(0)
  const reduceMotion = useReducedMotion()
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const [isDragging, setIsDragging] = useState(false)

  const rootFontSize = typeof window === 'undefined'
    ? 16
    : Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

  const configRef = useRef<WheelConfig>({
    count: items.length,
    items,
    rowHeight: Math.max(fontSize * spacing * rootFontSize, 1),
    curve,
    tilt,
    blur,
    fade,
    minOpacity,
    side,
    loop,
    smoothing,
    draggable,
    soundUrl,
    soundVolume,
  })

  onChangeRef.current = onChange
  configRef.current = {
    count: items.length,
    items,
    rowHeight: Math.max(fontSize * spacing * rootFontSize, 1),
    curve,
    tilt,
    blur: reduceMotion ? 0 : blur,
    fade,
    minOpacity,
    side,
    loop,
    smoothing: reduceMotion ? 1 : smoothing,
    draggable,
    soundUrl,
    soundVolume,
  }

  const layoutItems = useCallback((position: number) => {
    const config = configRef.current
    if (config.count === 0) return
    const mirror = config.side === 'right' ? -1 : 1
    const tiltRadians = (config.tilt * Math.PI) / 180
    const radius = tiltRadians > 0.0005 ? config.rowHeight / tiltRadians : 0

    itemRefs.current.forEach((element, index) => {
      if (!element) return
      let distanceFromSelection = index - position
      if (config.loop && config.count > 1) {
        distanceFromSelection = ((distanceFromSelection % config.count) + config.count) % config.count
        if (distanceFromSelection > config.count / 2) distanceFromSelection -= config.count
      }

      const distance = Math.abs(distanceFromSelection)
      let x = 0
      let y = distanceFromSelection * config.rowHeight
      let rotation = 0
      if (radius > 0) {
        const angle = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, distanceFromSelection * tiltRadians),
        )
        y = radius * Math.sin(angle)
        x = -mirror * radius * (1 - Math.cos(angle)) * config.curve
        rotation = (mirror * angle * 180) / Math.PI
      }

      element.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rotation.toFixed(3)}deg)`
      element.style.opacity = String(Math.max(config.minOpacity, 1 - distance * config.fade))
      element.style.filter = config.blur > 0 ? `blur(${(distance * config.blur).toFixed(2)}px)` : 'none'
      element.style.setProperty('--option-progress', Math.max(0, 1 - Math.min(distance, 1)).toFixed(4))
    })
  }, [])

  const runFrame = useCallback((now: number) => {
    const config = configRef.current
    if (config.count === 0) {
      frameRef.current = null
      return
    }

    const deltaTime = Math.min((now - lastFrameRef.current) / 1000, 0.05)
    lastFrameRef.current = now
    const smoothingSeconds = Math.max(config.smoothing, 1) / 1000
    const easing = 1 - Math.exp(-deltaTime / smoothingSeconds)
    const target = targetRef.current
    let next = positionRef.current + (target - positionRef.current) * easing
    const settled = Math.abs(target - next) < 0.001
    if (settled) next = target
    positionRef.current = next
    layoutItems(next)

    frameRef.current = settled ? null : requestAnimationFrame(runFrame)
  }, [layoutItems])

  const startLoop = useCallback(() => {
    if (frameRef.current !== null) return
    lastFrameRef.current = performance.now()
    frameRef.current = requestAnimationFrame(runFrame)
  }, [runFrame])

  const playTick = useCallback(() => {
    const { soundUrl: currentSoundUrl, soundVolume: currentVolume } = configRef.current
    if (!currentSoundUrl) return
    const now = performance.now()
    if (now - lastTickRef.current < 70) return
    lastTickRef.current = now
    if (!audioRef.current || audioUrlRef.current !== currentSoundUrl) {
      audioRef.current = new Audio(currentSoundUrl)
      audioRef.current.preload = 'auto'
      audioUrlRef.current = currentSoundUrl
    }
    audioRef.current.volume = Math.min(Math.max(currentVolume, 0), 1)
    audioRef.current.currentTime = 0
    void audioRef.current.play().catch(() => undefined)
  }, [])

  const applyTarget = useCallback((value: number, snap: boolean) => {
    const config = configRef.current
    if (config.count === 0) return
    let nextTarget = value
    if (!config.loop) {
      nextTarget = Math.min(Math.max(nextTarget, 0), Math.max(config.count - 1, 0))
    }
    if (snap) nextTarget = Math.round(nextTarget)
    targetRef.current = nextTarget
    if (snap || reduceMotion) {
      positionRef.current = nextTarget
      layoutItems(nextTarget)
    } else {
      layoutItems(positionRef.current)
    }
    const index = ((Math.round(nextTarget) % config.count) + config.count) % config.count
    if (index !== selectedRef.current) {
      selectedRef.current = index
      setSelectedIndex(index)
      onChangeRef.current?.(index, config.items[index])
      playTick()
    }
    startLoop()
  }, [layoutItems, playTick, reduceMotion, startLoop])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const config = configRef.current
      const delta = event.deltaMode === 1 ? event.deltaY * 24 : event.deltaY
      const step = Math.max(-1, Math.min(1, delta / config.rowHeight))
      applyTarget(targetRef.current + step, false)
      if (wheelTimerRef.current !== null) window.clearTimeout(wheelTimerRef.current)
      wheelTimerRef.current = window.setTimeout(() => applyTarget(targetRef.current, true), 140)
    }
    root.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      root.removeEventListener('wheel', handleWheel)
      if (wheelTimerRef.current !== null) window.clearTimeout(wheelTimerRef.current)
    }
  }, [applyTarget])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!configRef.current.draggable) return
    dragRef.current = {
      y: event.clientY,
      start: targetRef.current,
      pointerId: event.pointerId,
    }
    dragMovedRef.current = false
    setIsDragging(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const deltaY = event.clientY - drag.y
    if (!dragMovedRef.current && Math.abs(deltaY) > 4) {
      dragMovedRef.current = true
      rootRef.current?.setPointerCapture(drag.pointerId)
    }
    if (dragMovedRef.current) {
      applyTarget(drag.start - deltaY / configRef.current.rowHeight, false)
    }
  }

  const handlePointerEnd = () => {
    if (!dragRef.current) return
    dragRef.current = null
    setIsDragging(false)
    if (dragMovedRef.current) applyTarget(targetRef.current, true)
  }

  const handleItemClick = (index: number) => {
    if (dragMovedRef.current) return
    const config = configRef.current
    const current = targetRef.current
    let distance = index - (((current % config.count) + config.count) % config.count)
    if (config.loop && config.count > 1) {
      if (distance > config.count / 2) distance -= config.count
      else if (distance < -config.count / 2) distance += config.count
    }
    applyTarget(current + distance, true)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    let delta: number | null = null
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') delta = -1
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') delta = 1
    if (delta === null) return
    event.preventDefault()
    applyTarget(Math.round(targetRef.current) + delta, true)
  }

  useEffect(() => {
    applyTarget(targetRef.current, false)
  }, [applyTarget, blur, curve, fade, fontSize, items, loop, minOpacity, side, smoothing, spacing, tilt])

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    audioRef.current?.pause()
  }, [])

  const wheelStyle: WheelStyle = {
    '--option-text': textColor,
    '--option-active': activeColor,
    '--option-font-size': `${fontSize}rem`,
    '--option-inset': `${inset}px`,
  }

  return (
    <div
      ref={rootRef}
      role="listbox"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-activedescendant={items.length > 0 ? `contact-option-${selectedIndex}` : undefined}
      className={`option-wheel${side === 'right' ? ' option-wheel--right' : ''}${isDragging ? ' option-wheel--dragging' : ''}${className ? ` ${className}` : ''}`}
      style={wheelStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      {items.map((label, index) => (
        <div
          id={`contact-option-${index}`}
          key={`${label}-${index}`}
          ref={(element) => { itemRefs.current[index] = element }}
          role="option"
          aria-selected={selectedIndex === index}
          className={`option-wheel__item${selectedIndex === index ? ' option-wheel__item--selected' : ''}`}
          onClick={() => handleItemClick(index)}
        >
          {label}
        </div>
      ))}
    </div>
  )
}
