import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import './CircularGallery.css'

export interface CircularGalleryItem {
  image: string
  text: string
  alt: string
}

interface CircularGalleryProps {
  items: CircularGalleryItem[]
  bend?: number
  borderRadius?: number
  scrollSpeed?: number
  scrollEase?: number
  autoSpeed?: number
}

interface GalleryMedia {
  mesh: Mesh<Plane, Program>
  program: Program
  index: number
  extra: number
  x: number
  width: number
  widthTotal: number
}

const vertexShader = `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpeed;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    p.z = (sin(p.x * 4.0 + uTime) + cos(p.y * 2.0 + uTime)) * (0.06 + min(abs(uSpeed), 0.28));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragmentShader = `
  precision highp float;
  uniform vec2 uImageSizes;
  uniform vec2 uPlaneSizes;
  uniform sampler2D tMap;
  uniform float uBorderRadius;
  varying vec2 vUv;

  float roundedBoxSDF(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b;
    return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
  }

  void main() {
    vec2 ratio = vec2(
      min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
      min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
    );
    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
    vec4 color = texture2D(tMap, uv);
    float distanceToEdge = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
    float alpha = 1.0 - smoothstep(-0.002, 0.002, distanceToEdge);
    gl_FragColor = vec4(color.rgb, color.a * alpha);
  }
`

function StaticGallery({ items }: { items: CircularGalleryItem[] }) {
  return (
    <div
      className="circular-gallery__fallback"
      role="region"
      aria-label="项目图片画廊"
      tabIndex={0}
    >
      {items.map((item) => (
        <figure key={item.image}>
          <img src={item.image} alt={item.alt} width="1280" height="853" loading="lazy" />
          <figcaption>{item.text}</figcaption>
        </figure>
      ))}
    </div>
  )
}

export function CircularGallery({
  items,
  bend = 2.8,
  borderRadius = 0.055,
  scrollSpeed = 2,
  scrollEase = 0.055,
  autoSpeed = 0.42,
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const [failed, setFailed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container || reduceMotion) return
    if (typeof window.IntersectionObserver === 'undefined') {
      setEnabled(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEnabled(true)
          observer.disconnect()
        }
      },
      { rootMargin: '280px' },
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [reduceMotion])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled || reduceMotion || failed || items.length === 0) return

    let renderer: Renderer | undefined
    let animationFrame = 0
    let resizeObserver: ResizeObserver | undefined
    let intersectionObserver: IntersectionObserver | undefined
    let isInViewport = true
    let isHovered = false
    let isFocused = false
    let isDragging = false
    let pointerId = -1
    let dragStartX = 0
    let dragStartTarget = 0
    let lastTime = performance.now()
    let lastActiveIndex = -1

    const scroll = { current: 0, target: 0, last: 0 }
    const screen = { width: 1, height: 1 }
    const viewport = { width: 1, height: 1 }
    const mediaRecords: GalleryMedia[] = []

    try {
      renderer = new Renderer({
        alpha: true,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio || 1, 1.75),
      })
      const gl = renderer.gl
      gl.clearColor(0, 0, 0, 0)
      container.appendChild(gl.canvas)

      const camera = new Camera(gl)
      camera.fov = 45
      camera.position.z = 20
      const scene = new Transform()
      const geometry = new Plane(gl, { widthSegments: 48, heightSegments: 28 })
      const repeatedItems = [...items, ...items]

      for (const [index, item] of repeatedItems.entries()) {
        const texture = new Texture(gl, { generateMipmaps: true })
        const program = new Program(gl, {
          vertex: vertexShader,
          fragment: fragmentShader,
          depthTest: false,
          depthWrite: false,
          transparent: true,
          uniforms: {
            tMap: { value: texture },
            uPlaneSizes: { value: [1, 1] },
            uImageSizes: { value: [1, 1] },
            uSpeed: { value: 0 },
            uTime: { value: index * 0.31 },
            uBorderRadius: { value: borderRadius },
          },
        })
        const mesh = new Mesh(gl, { geometry, program })
        mesh.setParent(scene)
        const image = new Image()
        image.decoding = 'async'
        image.src = item.image
        image.onload = () => {
          texture.image = image
          program.uniforms.uImageSizes.value = [image.naturalWidth, image.naturalHeight]
        }
        image.onerror = () => setFailed(true)
        mediaRecords.push({ mesh, program, index, extra: 0, x: 0, width: 1, widthTotal: 1 })
      }

      const resize = () => {
        screen.width = Math.max(container.clientWidth, 1)
        screen.height = Math.max(container.clientHeight, 1)
        renderer?.setSize(screen.width, screen.height)
        camera.perspective({ aspect: screen.width / screen.height })
        const fov = (camera.fov * Math.PI) / 180
        viewport.height = 2 * Math.tan(fov / 2) * camera.position.z
        viewport.width = viewport.height * camera.aspect

        const responsiveScale = screen.width < 768 ? 0.76 : screen.width < 1100 ? 0.88 : 1
        const planeHeight = viewport.height * 0.48 * responsiveScale
        const planeWidth = planeHeight * 1.38
        const padding = screen.width < 768 ? 0.72 : 1.15
        const width = planeWidth + padding
        const widthTotal = width * mediaRecords.length
        mediaRecords.forEach((media, index) => {
          media.mesh.scale.set(planeWidth, planeHeight, 1)
          media.program.uniforms.uPlaneSizes.value = [planeWidth, planeHeight]
          media.width = width
          media.widthTotal = widthTotal
          media.x = width * index
        })
      }

      const updateMedia = (media: GalleryMedia, direction: 'left' | 'right') => {
        media.mesh.position.x = media.x - scroll.current - media.extra
        const x = media.mesh.position.x
        const halfViewport = viewport.width / 2
        if (bend === 0) {
          media.mesh.position.y = 0
          media.mesh.rotation.z = 0
        } else {
          const absoluteBend = Math.abs(bend)
          const radius = (halfViewport * halfViewport + absoluteBend * absoluteBend) / (2 * absoluteBend)
          const effectiveX = Math.min(Math.abs(x), halfViewport)
          const arc = radius - Math.sqrt(Math.max(radius * radius - effectiveX * effectiveX, 0))
          media.mesh.position.y = bend > 0 ? -arc : arc
          const rotation = Math.asin(Math.min(effectiveX / radius, 1))
          media.mesh.rotation.z = (bend > 0 ? -1 : 1) * Math.sign(x) * rotation
        }

        const speed = scroll.current - scroll.last
        media.program.uniforms.uTime.value += 0.035
        media.program.uniforms.uSpeed.value = speed
        const planeOffset = media.mesh.scale.x / 2
        const viewportOffset = viewport.width / 2
        const isBefore = media.mesh.position.x + planeOffset < -viewportOffset
        const isAfter = media.mesh.position.x - planeOffset > viewportOffset
        if (direction === 'right' && isBefore) media.extra -= media.widthTotal
        if (direction === 'left' && isAfter) media.extra += media.widthTotal
      }

      const update = (now: number) => {
        const deltaSeconds = Math.min((now - lastTime) / 1000, 0.05)
        lastTime = now
        const shouldAutoPlay = isInViewport && !isHovered && !isFocused && !isDragging && !document.hidden
        if (shouldAutoPlay) scroll.target -= autoSpeed * deltaSeconds
        scroll.current += (scroll.target - scroll.current) * scrollEase
        const direction = scroll.current > scroll.last ? 'right' : 'left'
        mediaRecords.forEach((media) => updateMedia(media, direction))

        const nearest = mediaRecords.reduce((best, media) => (
          Math.abs(media.mesh.position.x) < Math.abs(best.mesh.position.x) ? media : best
        ))
        const nextActiveIndex = nearest.index % items.length
        if (nextActiveIndex !== lastActiveIndex) {
          lastActiveIndex = nextActiveIndex
          setActiveIndex(nextActiveIndex)
        }

        renderer?.render({ scene, camera })
        scroll.last = scroll.current
        animationFrame = window.requestAnimationFrame(update)
      }

      const onWheel = (event: WheelEvent) => {
        const direction = Math.sign(event.deltaY || event.deltaX)
        if (direction === 0) return
        container.dataset.wheelDirection = direction > 0 ? 'right' : 'left'
        scroll.target -= direction * scrollSpeed * 0.48
      }
      const onPointerDown = (event: PointerEvent) => {
        isDragging = true
        pointerId = event.pointerId
        dragStartX = event.clientX
        dragStartTarget = scroll.target
        container.setPointerCapture(pointerId)
      }
      const onPointerMove = (event: PointerEvent) => {
        if (!isDragging || event.pointerId !== pointerId) return
        const worldDelta = (event.clientX - dragStartX) * (viewport.width / screen.width)
        scroll.target = dragStartTarget - worldDelta
      }
      const onPointerEnd = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return
        isDragging = false
        if (container.hasPointerCapture(pointerId)) container.releasePointerCapture(pointerId)
        pointerId = -1
      }
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        scroll.target += event.key === 'ArrowLeft' ? scrollSpeed : -scrollSpeed
      }
      const onVisibilityChange = () => {
        lastTime = performance.now()
      }
      const onPointerEnter = () => { isHovered = true }
      const onPointerLeave = () => { isHovered = false }
      const onFocusIn = () => { isFocused = true }
      const onFocusOut = () => { isFocused = false }

      container.addEventListener('wheel', onWheel, { passive: true })
      container.addEventListener('pointerdown', onPointerDown)
      container.addEventListener('pointermove', onPointerMove)
      container.addEventListener('pointerup', onPointerEnd)
      container.addEventListener('pointercancel', onPointerEnd)
      container.addEventListener('pointerenter', onPointerEnter)
      container.addEventListener('pointerleave', onPointerLeave)
      container.addEventListener('focusin', onFocusIn)
      container.addEventListener('focusout', onFocusOut)
      container.addEventListener('keydown', onKeyDown)
      document.addEventListener('visibilitychange', onVisibilityChange)

      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(container)
      intersectionObserver = new IntersectionObserver(([entry]) => {
        isInViewport = entry.isIntersecting
        lastTime = performance.now()
      })
      intersectionObserver.observe(container)
      resize()
      animationFrame = window.requestAnimationFrame(update)

      return () => {
        window.cancelAnimationFrame(animationFrame)
        resizeObserver?.disconnect()
        intersectionObserver?.disconnect()
        document.removeEventListener('visibilitychange', onVisibilityChange)
        container.removeEventListener('wheel', onWheel)
        container.removeEventListener('pointerdown', onPointerDown)
        container.removeEventListener('pointermove', onPointerMove)
        container.removeEventListener('pointerup', onPointerEnd)
        container.removeEventListener('pointercancel', onPointerEnd)
        container.removeEventListener('pointerenter', onPointerEnter)
        container.removeEventListener('pointerleave', onPointerLeave)
        container.removeEventListener('focusin', onFocusIn)
        container.removeEventListener('focusout', onFocusOut)
        container.removeEventListener('keydown', onKeyDown)
        gl.canvas.remove()
        gl.getExtension('WEBGL_lose_context')?.loseContext()
      }
    } catch {
      setFailed(true)
    }
  }, [autoSpeed, bend, borderRadius, enabled, failed, items, reduceMotion, scrollEase, scrollSpeed])

  if (reduceMotion || failed) return <StaticGallery items={items} />

  return (
    <div className="circular-gallery-shell">
      <div
        ref={containerRef}
        className="circular-gallery"
        data-active-index={activeIndex}
        tabIndex={0}
        role="region"
        aria-label="彩色弧形项目画廊。使用左右方向键、拖动或滚轮浏览。"
      >
        {!enabled ? <div className="circular-gallery__loading" aria-hidden="true" /> : null}
      </div>
      <p className="circular-gallery__hint">AUTO / DRAG / WHEEL ↑ LEFT · ↓ RIGHT</p>
      <div className="circular-gallery__status" aria-live="polite">
        <span>FRAME {String(activeIndex + 1).padStart(2, '0')}</span>
        <strong>{items[activeIndex]?.text}</strong>
      </div>
      <div className="sr-only">
        {items.map((item) => <span key={item.image}>{item.text}：{item.alt}</span>)}
      </div>
    </div>
  )
}
