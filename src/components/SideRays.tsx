import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import './SideRays.css'

type RayOrigin = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

interface SideRaysProps {
  speed?: number
  rayColor1?: string
  rayColor2?: string
  intensity?: number
  spread?: number
  origin?: RayOrigin
  tilt?: number
  saturation?: number
  blend?: number
  falloff?: number
  opacity?: number
  className?: string
}

const vertexShader = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

const fragmentShader = `
precision highp float;
uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iFlipX;
uniform float iFlipY;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;

float rayStrength(vec2 source, vec2 direction, vec2 coord, float seedA, float seedB, float speed) {
  vec2 delta = coord - source;
  float cosine = dot(normalize(delta), direction);
  return clamp(
    (0.45 + 0.15 * sin(cosine * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-cosine * seedB + iTime * speed)),
    0.0, 1.0
  ) * clamp((iResolution.x - length(delta)) / iResolution.x, 0.5, 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 source = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);
  float tilt = iTilt * 3.14159265 / 180.0;
  float cs = cos(tilt);
  float sn = sin(tilt);
  vec2 relative = coord - source;
  vec2 tilted = vec2(relative.x * cs - relative.y * sn, relative.x * sn + relative.y * cs) + source;
  float halfSpread = iSpread * 0.275;
  vec2 direction1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
  vec2 direction2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));
  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(source, direction1, tilted, 36.2214, 21.11349, iSpeed);
  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(source, direction2, tilted, 22.3991, 18.0234, iSpeed * 0.2);
  vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;
  float distanceToLight = length(fragCoord - vec2(source.x, iResolution.y - source.y)) / iResolution.y;
  color.rgb *= iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, iSaturation);
  color.a = max(color.r, max(color.g, color.b)) * iOpacity;
  gl_FragColor = color;
}
`

function hexToRgb(hex: string): [number, number, number] {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!match) return [1, 1, 1]
  return [1, 2, 3].map((index) => Number.parseInt(match[index], 16) / 255) as [number, number, number]
}

function originToFlip(origin: RayOrigin): [number, number] {
  if (origin === 'top-left') return [1, 0]
  if (origin === 'bottom-right') return [0, 1]
  if (origin === 'bottom-left') return [1, 1]
  return [0, 0]
}

export function SideRays({
  speed = 0.22,
  rayColor1 = '#f4c979',
  rayColor2 = '#6da7c7',
  intensity = 0.8,
  spread = 1.25,
  origin = 'top-right',
  tilt = -8,
  saturation = 0.8,
  blend = 0.32,
  falloff = 1.55,
  opacity = 0.7,
  className = '',
}: SideRaysProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [failed, setFailed] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.05,
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const useStaticFallback = reduceMotion || window.matchMedia('(max-width: 760px)').matches
    if (!container || !isVisible || useStaticFallback) return

    let renderer: import('ogl').Renderer | null = null
    let resizeObserver: ResizeObserver | null = null
    let stopped = false
    let delayId: number | null = null

    const initialize = async () => {
      await new Promise<void>((resolve) => {
        delayId = window.setTimeout(resolve, 700)
      })
      if (stopped) return

      try {
        const { Mesh, Program, Renderer, Triangle } = await import('ogl')
        if (stopped) return
        renderer = new Renderer({
          dpr: Math.min(window.devicePixelRatio || 1, 1.5),
          alpha: true,
          antialias: false,
        })
        const gl = renderer.gl
        const canvas = gl.canvas as HTMLCanvasElement
        canvas.setAttribute('aria-hidden', 'true')
        container.replaceChildren(canvas)

        const [flipX, flipY] = originToFlip(origin)
        const uniforms = {
          iTime: { value: 0 },
          iResolution: { value: [1, 1] },
          iSpeed: { value: speed },
          iRayColor1: { value: hexToRgb(rayColor1) },
          iRayColor2: { value: hexToRgb(rayColor2) },
          iIntensity: { value: intensity },
          iSpread: { value: spread },
          iFlipX: { value: flipX },
          iFlipY: { value: flipY },
          iTilt: { value: tilt },
          iSaturation: { value: saturation },
          iBlend: { value: blend },
          iFalloff: { value: falloff },
          iOpacity: { value: opacity },
        }
        const geometry = new Triangle(gl)
        const program = new Program(gl, {
          vertex: vertexShader,
          fragment: fragmentShader,
          uniforms,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        })
        const mesh = new Mesh(gl, { geometry, program })

        const resize = () => {
          if (!renderer || !container) return
          const { clientWidth, clientHeight } = container
          renderer.setSize(clientWidth, clientHeight)
          uniforms.iResolution.value = [clientWidth * renderer.dpr, clientHeight * renderer.dpr]
        }
        resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(container)
        resize()

        const render = (time: number) => {
          if (stopped || !renderer) return
          uniforms.iTime.value = time * 0.001
          renderer.render({ scene: mesh })
          frameRef.current = requestAnimationFrame(render)
        }
        frameRef.current = requestAnimationFrame(render)
      } catch {
        if (!stopped) setFailed(true)
      }
    }

    void initialize()

    return () => {
      stopped = true
      if (delayId !== null) window.clearTimeout(delayId)
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      resizeObserver?.disconnect()
      if (renderer) {
        const canvas = renderer.gl.canvas as HTMLCanvasElement
        canvas.remove()
        renderer.gl.getExtension('WEBGL_lose_context')?.loseContext()
      }
    }
  }, [blend, falloff, intensity, isVisible, opacity, origin, rayColor1, rayColor2, reduceMotion, saturation, speed, spread, tilt])

  return (
    <div
      ref={containerRef}
      className={`side-rays-container${reduceMotion || failed ? ' is-static' : ''} ${className}`.trim()}
      aria-hidden="true"
    />
  )
}
