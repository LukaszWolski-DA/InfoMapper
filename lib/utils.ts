import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize entity stereotype to allowed values
 * @param value - stereotype value to normalize
 * @returns normalized stereotype or "Object" as default
 */
export function normalizeStereotype(value?: string): string {
  const allowed = ["Object", "Link", "Dictionary", "Context", "Informative"]
  if (!value) return "Object"
  const normalized = value.trim()
  return allowed.includes(normalized) ? normalized : "Object"
}
