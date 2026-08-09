import { publicContent } from '../data/content'
import type { RoleLens } from '../data/types'

const supportedLenses = new Set<RoleLens>([
  'overview',
  'product',
  'ai-app',
  'python',
])

export function isRoleLens(value: string | null): value is RoleLens {
  return value !== null && supportedLenses.has(value as RoleLens)
}

export function parseRoleLens(value: string | null): RoleLens {
  return isRoleLens(value) ? value : 'overview'
}

export function getProjectOrder(lens: RoleLens): string[] {
  return [...publicContent.lenses[lens]]
}
