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
    // Fallback to hardcoded defaults if settings not available (use IDs, not labels)
    const allowedIds = ["object", "link", "dictionary", "context", "informative"]
    if (!value) return "object"
    // Case-insensitive match: find the properly cased ID
    const normalizedLower = value.toLowerCase().trim()
    const match = allowedIds.find(id => id === normalizedLower)
    return match || "object"
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

/**
 * Get display label for a stereotype ID
 * @param id - stereotype ID
 * @param settings - array of configured stereotypes
 * @returns display label or the ID if not found
 */
export function getStereotypeLabel(id?: string, settings?: EntityStereotypeConfig[]): string {
  if (!id) return "Object"

  if (!settings || settings.length === 0) {
    // Fallback mapping for hardcoded defaults
    const labelMap: Record<string, string> = {
      object: "Object",
      link: "Link",
      dictionary: "Dictionary",
      context: "Context",
      informative: "Informative"
    }
    return labelMap[id.toLowerCase()] || id
  }

  const stereotype = settings.find(s => s.id.toLowerCase() === id.toLowerCase())
  return stereotype ? stereotype.label : id
}

/**
 * Get color classes for a stereotype ID
 * @param id - stereotype ID
 * @param settings - array of configured stereotypes
 * @returns Tailwind color classes (background and border)
 */
export function getStereotypeColor(id?: string, settings?: EntityStereotypeConfig[]): string {
  if (!id) return "bg-white border-gray-300"

  if (!settings || settings.length === 0) {
    // Fallback color mapping for hardcoded defaults
    const colorMap: Record<string, string> = {
      object: "bg-blue-50 border-blue-200",
      link: "bg-teal-50 border-teal-200",
      context: "bg-amber-50 border-amber-200",
      dictionary: "bg-green-50 border-green-200",
      informative: "bg-gray-50 border-gray-200"
    }
    return colorMap[id.toLowerCase()] || "bg-white border-gray-300"
  }

  const stereotype = settings.find(s => s.id.toLowerCase() === id.toLowerCase())
  return stereotype ? stereotype.color : "bg-white border-gray-300"
}
