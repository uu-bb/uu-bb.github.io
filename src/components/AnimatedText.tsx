import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import type { MotionValue } from 'motion/react'

interface AnimatedTextProps {
  text: string
  className?: string
}

interface AnimatedCharacterProps {
  character: string
  index: number
  total: number
  progress: MotionValue<number>
  reduceMotion: boolean
}

function AnimatedCharacter({
  character,
  index,
  total,
  progress,
  reduceMotion,
}: AnimatedCharacterProps) {
  const start = index / total
  const end = Math.min(1, start + 0.18)
  const opacity = useTransform(progress, [start, end], [0.18, 1])

  return (
    <motion.span style={{ opacity: reduceMotion ? 1 : opacity }} aria-hidden="true">
      {character}
    </motion.span>
  )
}

export function AnimatedText({ text, className }: AnimatedTextProps) {
  const paragraphRef = useRef<HTMLParagraphElement>(null)
  const reduceMotion = Boolean(useReducedMotion())
  const { scrollYProgress } = useScroll({
    target: paragraphRef,
    offset: ['start 0.82', 'end 0.2'],
  })
  const characters = Array.from(text)

  return (
    <p ref={paragraphRef} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {characters.map((character, index) => (
          <AnimatedCharacter
            key={`${character}-${index}`}
            character={character}
            index={index}
            total={characters.length}
            progress={scrollYProgress}
            reduceMotion={reduceMotion}
          />
        ))}
      </span>
    </p>
  )
}
