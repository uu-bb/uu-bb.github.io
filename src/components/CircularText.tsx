import { useEffect } from 'react'
import {
  motion,
  useAnimation,
  useMotionValue,
  useReducedMotion,
} from 'motion/react'
import './CircularText.css'

type HoverMode = 'slowDown' | 'speedUp' | 'pause' | 'goBonkers'

interface CircularTextProps {
  text: string
  spinDuration?: number
  onHover?: HoverMode
  className?: string
}

const getRotationTransition = (duration: number, from: number, loop = true) => ({
  from,
  to: from + 360,
  ease: 'linear' as const,
  duration,
  type: 'tween' as const,
  repeat: loop ? Number.POSITIVE_INFINITY : 0,
})

const getTransition = (duration: number, from: number) => ({
  rotate: getRotationTransition(duration, from),
  scale: {
    type: 'spring' as const,
    damping: 20,
    stiffness: 300,
  },
})

export function CircularText({
  text,
  spinDuration = 20,
  onHover = 'speedUp',
  className = '',
}: CircularTextProps) {
  const letters = Array.from(text)
  const controls = useAnimation()
  const rotation = useMotionValue(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) {
      controls.set({ rotate: 0, scale: 1 })
      return
    }

    const start = rotation.get()
    void controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start),
    })
  }, [spinDuration, text, onHover, controls, rotation, reduceMotion])

  const handleHoverStart = () => {
    if (!onHover || reduceMotion) return

    const start = rotation.get()
    let transition = getTransition(spinDuration, start)
    let scale = 1

    if (onHover === 'slowDown') transition = getTransition(spinDuration * 2, start)
    if (onHover === 'speedUp') transition = getTransition(spinDuration / 4, start)
    if (onHover === 'goBonkers') {
      transition = getTransition(spinDuration / 20, start)
      scale = 0.8
    }
    if (onHover === 'pause') {
      void controls.stop()
      return
    }

    void controls.start({
      rotate: start + 360,
      scale,
      transition,
    })
  }

  const handleHoverEnd = () => {
    if (reduceMotion) return
    const start = rotation.get()
    void controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start),
    })
  }

  return (
    <motion.div
      className={`circular-text ${className}`.trim()}
      style={{ rotate: rotation }}
      initial={{ rotate: 0 }}
      animate={controls}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      aria-label={text.replaceAll('*', ' ')}
      role="img"
    >
      {letters.map((letter, index) => {
        const rotationDeg = (360 / letters.length) * index
        const factor = Math.PI / letters.length
        const offset = factor * index
        const transform = `rotateZ(${rotationDeg}deg) translate3d(${offset}px, ${offset}px, 0)`

        return (
          <span
            key={`${letter}-${index}`}
            style={{ transform, WebkitTransform: transform }}
            aria-hidden="true"
          >
            {letter}
          </span>
        )
      })}
    </motion.div>
  )
}
