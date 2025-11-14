"use client"

import { useEffect, useState, useMemo } from "react"
import { getObjectState, subscribe, setObjectState } from "@/lib/store"
import type { DiagramItem, Connection } from "@/lib/types"

export interface SelectedAttribute {
  itemId: string
  itemType: "entity" | "source" | "requirement"
  attrId: string
  attrName: string
}

/**
 * Validates and filters diagramItems to remove references to non-existent entities
 */
function validateDiagramItems(items: DiagramItem[], state: ReturnType<typeof getObjectState>): DiagramItem[] {
  return items.filter((item) => {
    if (item.itemType === "entity") {
      // Check if entity exists in logicalEntities
      const exists = state.logicalEntities.some(e => e.id === item.itemId)
      if (!exists) {
        console.warn(`[use-mapping-state] Filtering out invalid entity reference: ${item.itemId}`)
      }
      return exists
    }
    if (item.itemType === "requirement") {
      // Check if requirement exists
      const exists = state.requirements.some((r: any) => r.id === item.itemId)
      if (!exists) {
        console.warn(`[use-mapping-state] Filtering out invalid requirement reference: ${item.itemId}`)
      }
      return exists
    }
    // For sources, we can't validate here (they come from external storage)
    // so we keep them
    return true
  })
}

export function useMappingState() {
  // Diagram state from store
  const [diagramItems, setDiagramItems] = useState<DiagramItem[]>(() => {
    const state = getObjectState()
    return validateDiagramItems(state.items, state)
  })
  const [connections, setConnections] = useState<Connection[]>(getObjectState().connections)

  // Local filter state
  const [entityFilter, setEntityFilter] = useState("")
  const [sourceFilter, setSourceFilter] = useState("")
  const [requirementFilter, setRequirementFilter] = useState("")

  // Selected attribute state
  const [selectedAttribute, setSelectedAttribute] = useState<SelectedAttribute | null>(null)

  // Subscribe to store changes and validate on each update
  useEffect(() => {
    const unsub = subscribe(() => {
      const state = getObjectState()
      const validatedItems = validateDiagramItems(state.items, state)

      // Don't modify the store here - just filter for display
      // Modifying the store here would trigger an infinite loop
      if (validatedItems.length !== state.items.length) {
        console.warn(`[use-mapping-state] Filtered out ${state.items.length - validatedItems.length} invalid diagram items`)
      }

      setDiagramItems(validatedItems)
      setConnections(state.connections)
    })
    return () => unsub()
  }, [])

  return {
    diagramItems,
    connections,
    entityFilter,
    sourceFilter,
    requirementFilter,
    selectedAttribute,
    setEntityFilter,
    setSourceFilter,
    setRequirementFilter,
    setSelectedAttribute,
  }
}
