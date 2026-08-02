import { useEffect, type ReactNode } from 'react'
import './SpecularGlow.css'

export function SpecularGlow({ children }: { children: ReactNode }) {
  useEffect(() => {
    const updateLight = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return
      const surface = event.target.closest<HTMLElement>('[data-specular]')
      if (!surface) return
      const rect = surface.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      surface.style.setProperty('--specular-x', `${((event.clientX - rect.left) / rect.width) * 100}%`)
      surface.style.setProperty('--specular-y', `${((event.clientY - rect.top) / rect.height) * 100}%`)
    }

    document.addEventListener('pointermove', updateLight, { passive: true })
    return () => document.removeEventListener('pointermove', updateLight)
  }, [])

  return children
}
