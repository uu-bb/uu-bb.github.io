import { publicContent } from '../data/content'
import type { RoleLens } from '../data/types'

const supportedLenses = new Set<RoleLens>([
  'overview',
  'product',
  'ai-app',
  'python',
])

export function parseRoleLens(value: string | null): RoleLens {
  return value && supportedLenses.has(value as RoleLens)
    ? (value as RoleLens)
    : 'overview'
}

export function getProjectOrder(lens: RoleLens): string[] {
  return [...publicContent.lenses[lens]]
}
