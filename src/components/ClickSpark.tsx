import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { useReducedMotion } from 'motion/react'
import './ClickSpark.css'

interface ClickSparkProps {
  sparkColor?: string
  sparkSize?: number
  sparkRadius?: number
  sparkCount?: number
  duration?: number
  easing?: 'linear' | 'ease-in' | 'ease-in-out' | 'ease-out'
  extraScale?: number
  children: ReactNode
}

interface Spark {
  x: number
  y: number
  angle: number
  startTime: number
}

export function ClickSpark({
  sparkColor = '#168fd0',
  sparkSize = 10,
  sparkRadius = 22,
  sparkCount = 8,
  duration = 420,
  easing = 'ease-out',
  extraScale = 1,
  children,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparksRef = useRef<Spark[]>([])
  const animationRef = useRef<number | null>(null)
  const reduceMotion = useReducedMotion()

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const scale = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(window.innerWidth * scale)
    canvas.height = Math.round(window.innerHeight * scale)
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
    const context = canvas.getContext('2d')
    context?.setTransform(scale, 0, 0, scale, 0, 0)
  }, [])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    }
  }, [resizeCanvas])

  const ease = useCallback((progress: number) => {
    if (easing === 'linear') return progress
    if (easing === 'ease-in') return progress * progress
    if (easing === 'ease-in-out') {
      return progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress
    }
    return progress * (2 - progress)
  }, [easing])

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    context.clearRect(0, 0, window.innerWidth, window.innerHeight)
    sparksRef.current = sparksRef.current.filter((spark) => {
      const elapsed = timestamp - spark.startTime
      if (elapsed >= duration) return false

      const eased = ease(elapsed / duration)
      const distance = eased * sparkRadius * extraScale
      const lineLength = sparkSize * (1 - eased)
      const cosine = Math.cos(spark.angle)
      const sine = Math.sin(spark.angle)

      context.strokeStyle = sparkColor
      context.lineWidth = 2
      context.lineCap = 'round'
      context.beginPath()
      context.moveTo(
        spark.x + distance * cosine,
        spark.y + distance * sine,
      )
      context.lineTo(
        spark.x + (distance + lineLength) * cosine,
        spark.y + (distance + lineLength) * sine,
      )
      context.stroke()
      return true
    })

    if (sparksRef.current.length > 0) animationRef.current = requestAnimationFrame(draw)
    else animationRef.current = null
  }, [duration, ease, extraScale, sparkColor, sparkRadius, sparkSize])

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || event.detail === 0) return
    const now = performance.now()
    sparksRef.current.push(...Array.from({ length: sparkCount }, (_, index) => ({
      x: event.clientX,
      y: event.clientY,
      angle: (2 * Math.PI * index) / sparkCount,
      startTime: now,
    })))
    if (animationRef.current === null) animationRef.current = requestAnimationFrame(draw)
  }

  return (
    <div className="click-spark-root" onClick={handleClick}>
      <canvas ref={canvasRef} className="click-spark-canvas" aria-hidden="true" />
      {children}
    </div>
  )
}
