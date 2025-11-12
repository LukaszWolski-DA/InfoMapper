import { getObjectState, setObjectState } from "@/lib/store"
import { normalizeStereotype } from "@/lib/utils"
import { toast } from "sonner"
import { handleError, safeLocalStorage } from "@/lib/error-handler"
import * as Schemas from "@/lib/schemas/validation"
import type { DiagramItem, Relationship } from "@/lib/types"

// ============================
// Type Definitions
// ============================

export interface ImportOptions {
  /** If true, merge with existing data. If false, replace all data. */
  merge?: boolean
  /** If true, validate imported data with Zod schemas. */
  validate?: boolean
}

export interface ImportResult {
  success: boolean
  message: string
  stats?: {
    concepts: number
    entities: number
    attributes: number
    connections: number
    requirements: number
  }
}

export interface ClearDataOptions {
  /** If true, show toast notifications. Default: true */
  showToast?: boolean
  /** If true, reload the page after clearing. Default: true */
  reload?: boolean
  /** Custom localStorage keys to clear. Default: all InfoMapper keys */
  keys?: string[]
}

export interface ClearDataResult {
  success: boolean
  cleared: number
  failed: number
}

export interface ExportOptions {
  /** Filename for the exported file. Default: "info_mapper_export.json" */
  filename?: string
}

// ============================
// Constants
// ============================

const DEFAULT_STORAGE_KEYS = [
  "infoMapperStateV1",
  "infoMapperSourcesV1",
  "infoMapperRequirementsV1",
  "objectTreeUIv1",
  "infoMapperUIv1",
]

// ============================
// Export Functionality
// ============================

/**
 * Exports the current application state to a JSON file.
 *
 * @param options - Export options including filename
 *
 * @example
 * exportData({ filename: "my-export.json" })
 */
export function exportData(options?: ExportOptions): void {
  try {
    const state = getObjectState()

    const payload = {
      timestamp: new Date().toISOString(),
      items: state.items,
      connections: state.connections,
      modelItems: state.modelItems,
      modelRelationships: state.modelRelationships,
      concepts: state.concepts,
      logicalEntities: state.logicalEntities,
      logicalAttributes: state.logicalAttributes,
      requirements: state.requirements,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = options?.filename || "info_mapper_export.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Data exported successfully")
  } catch (error) {
    handleError({
      context: "import-export",
      error,
      action: "exportData",
      userMessage: "Failed to export data. Please try again.",
    })
  }
}

// ============================
// Import Functionality
// ============================

/**
 * Imports application data from a JSON file.
 *
 * @param file - The JSON file to import
 * @param options - Import options (merge mode, validation)
 * @returns Promise with import result including success status and stats
 *
 * @example
 * const result = await importData(file, { merge: false, validate: true })
 * if (result.success) {
 *   console.log("Imported:", result.stats)
 * }
 */
export async function importData(
  file: File,
  options?: ImportOptions
): Promise<ImportResult> {
  const { merge = false, validate = true } = options || {}

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = () => {
      try {
        const raw = JSON.parse(reader.result as string)

        // Validate with Zod schema if validation is enabled
        const data = validate
          ? Schemas.PersistedStateSchema.parse(raw)
          : raw

        // Get current settings for normalization
        const currentState = getObjectState()
        const settings = currentState.settings

        // Normalize entity stereotypes in diagram items
        const normItems = normalizeImportedItems(
          data.items || [],
          settings.entityStereotypes
        )
        const normModelItems = normalizeImportedItems(
          data.modelItems || [],
          settings.entityStereotypes
        )

        // Update state (merge or replace)
        if (merge) {
          // Merge mode: combine with existing data
          setObjectState((prev) => ({
            ...prev,
            items: [...prev.items, ...normItems],
            connections: [...prev.connections, ...(data.connections || [])],
            modelItems: [...prev.modelItems, ...normModelItems],
            modelRelationships: [
              ...prev.modelRelationships,
              ...(data.modelRelationships || []),
            ],
            concepts: [...prev.concepts, ...(data.concepts || [])],
            logicalEntities: [
              ...prev.logicalEntities,
              ...(data.logicalEntities || []),
            ],
            logicalAttributes: [
              ...prev.logicalAttributes,
              ...(data.logicalAttributes || []),
            ],
            requirements: [...prev.requirements, ...(data.requirements || [])],
          }))
        } else {
          // Replace mode: overwrite existing data
          setObjectState((prev) => ({
            ...prev,
            items: normItems,
            connections: data.connections || [],
            modelItems: normModelItems,
            modelRelationships: (data.modelRelationships || []) as Relationship[],
            concepts: data.concepts || [],
            logicalEntities: data.logicalEntities || [],
            logicalAttributes: data.logicalAttributes || [],
            requirements: data.requirements || [],
          }))
        }

        // Calculate stats
        const stats = {
          concepts: (data.concepts || []).length,
          entities: (data.logicalEntities || []).length,
          attributes: (data.logicalAttributes || []).length,
          connections: (data.connections || []).length,
          requirements: (data.requirements || []).length,
        }

        toast.success(
          merge
            ? `Data merged successfully: ${stats.entities} entities, ${stats.attributes} attributes`
            : `Data imported successfully: ${stats.entities} entities, ${stats.attributes} attributes`
        )

        resolve({
          success: true,
          message: "Import completed successfully",
          stats,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"

        handleError({
          context: "import-export",
          error,
          action: "importData",
          userMessage: "Invalid JSON file. Please check the file format.",
        })

        resolve({
          success: false,
          message: `Import failed: ${errorMessage}`,
        })
      }
    }

    reader.onerror = () => {
      handleError({
        context: "import-export",
        error: reader.error,
        action: "importData",
        userMessage: "Failed to read file. Please try again.",
      })

      resolve({
        success: false,
        message: "Failed to read file",
      })
    }

    reader.readAsText(file)
  })
}

// ============================
// Clear Data Functionality
// ============================

/**
 * Clears all application data from localStorage.
 *
 * @param options - Clear options (toast, reload, custom keys)
 * @returns Promise with clear result including success count
 *
 * @example
 * const result = await clearAllData({ showToast: true, reload: true })
 * console.log(`Cleared ${result.cleared} items`)
 */
export async function clearAllData(
  options?: ClearDataOptions
): Promise<ClearDataResult> {
  const {
    showToast = true,
    reload = true,
    keys = DEFAULT_STORAGE_KEYS,
  } = options || {}

  try {
    let successCount = 0
    let failedCount = 0

    keys.forEach((key) => {
      if (safeLocalStorage.removeItem(key)) {
        successCount++
      } else {
        failedCount++
      }
    })

    const success = successCount === keys.length

    if (showToast) {
      if (success) {
        toast.success("All data cleared successfully")
      } else {
        toast.warning(`Cleared ${successCount} of ${keys.length} storage items`)
      }
    }

    // Reload page after a short delay (gives user time to see the toast)
    if (reload) {
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }

    return {
      success,
      cleared: successCount,
      failed: failedCount,
    }
  } catch (error) {
    handleError({
      context: "import-export",
      error,
      action: "clearAllData",
      userMessage: "Failed to clear application data. Please try again.",
    })

    return {
      success: false,
      cleared: 0,
      failed: keys.length,
    }
  }
}

// ============================
// Helper Functions
// ============================

/**
 * Normalizes entity stereotypes in imported diagram items.
 * Ensures stereotypes match configured values.
 *
 * @param items - Array of diagram items to normalize
 * @param entityStereotypes - Configured entity stereotypes
 * @returns Normalized diagram items
 */
function normalizeImportedItems(
  items: any[],
  entityStereotypes: any[]
): DiagramItem[] {
  return items.map((item) => {
    if (item.itemType === "entity") {
      return {
        ...item,
        objectType: normalizeStereotype(
          item.objectType as string,
          entityStereotypes
        ),
      }
    }
    return item
  }) as DiagramItem[]
}
