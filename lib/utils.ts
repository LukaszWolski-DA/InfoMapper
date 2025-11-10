import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { EntityStereotypeConfig } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize entity stereotype to allowed values from settings
 * @param value - stereotype value to normalize
 * @param settings - array of configured stereotypes
 * @returns normalized stereotype ID or first available as default
 */
export function normalizeStereotype(value?: string, settings?: EntityStereotypeConfig[]): string {
  if (!settings || settings.length === 0) {
    // Fallback to hardcoded defaults if settings not available
    const allowed = ["object", "link", "dictionary", "context", "informative"]
    if (!value) return "object"
    const normalized = value.toLowerCase().trim()
    return allowed.includes(normalized) ? normalized : "object"
  }

  if (!value) {
    // Return first default or first available
    const defaultStereotype = settings.find(s => s.isDefault) || settings[0]
    return defaultStereotype.id
  }

  const normalized = value.toLowerCase().trim()

  // Try to find by ID first
  const byId = settings.find(s => s.id.toLowerCase() === normalized)
  if (byId) return byId.id

  // Try to find by label
  const byLabel = settings.find(s => s.label.toLowerCase() === normalized)
  if (byLabel) return byLabel.id

  // Return first default or first available as fallback
  const defaultStereotype = settings.find(s => s.isDefault) || settings[0]
  return defaultStereotype.id
}
