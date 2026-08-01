import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'

interface MagnetProps {
  children: ReactNode
  className?: string
  padding?: number
  strength?: number
}

export function Magnet({
  children,
  className,
  padding = 150,
  strength = 18,
}: MagnetProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const x = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 })
  const y = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 })

  useEffect(() => {
    if (reduceMotion || window.matchMedia('(pointer: coarse)').matches) return

    let frame = 0
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const element = elementRef.current
        if (!element) return
        const rect = element.getBoundingClientRect()
        const inside =
          event.clientX >= rect.left - padding &&
          event.clientX <= rect.right + padding &&
          event.clientY >= rect.top - padding &&
          event.clientY <= rect.bottom + padding

        if (!inside) {
          x.set(0)
          y.set(0)
          return
        }

        x.set((event.clientX - (rect.left + rect.width / 2)) / strength)
        y.set((event.clientY - (rect.top + rect.height / 2)) / strength)
      })
    }

    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', move)
    }
  }, [padding, reduceMotion, strength, x, y])

  return (
    <motion.div ref={elementRef} className={className} style={{ x, y }}>
      {children}
    </motion.div>
  )
}
