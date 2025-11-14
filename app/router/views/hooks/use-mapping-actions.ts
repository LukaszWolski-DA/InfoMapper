"use client"

import { useCallback, useState } from "react"
import type { Connection, Attribute, HandlePosition } from "@/lib/types"
import {
  addDiagramItem as cmdAddDiagramItem,
  hideDiagramItem as cmdHideDiagramItem,
  updateDiagramItemPosition as cmdUpdateDiagramItemPosition,
  updateDiagramItemWidth as cmdUpdateDiagramItemWidth,
  toggleDiagramItemCollapsed as cmdToggleDiagramItemCollapsed,
  setDiagramItemAttributeFilter as cmdSetDiagramItemAttributeFilter,
  addConnection as cmdAddConnection,
  deleteConnectionById as cmdDeleteConnectionById,
  updateAttribute as cmdUpdateAttribute,
  deleteAttribute as cmdDeleteAttribute,
  upsertCardAttribute,
  updateDiagramItemHandles as cmdUpdateDiagramItemHandles,
} from "@/lib/commands"
import { getObjectState, setObjectState } from "@/lib/store"
import type { DiagramItem, LogicalAttribute } from "@/lib/types"
import { toast } from "sonner"

export type ItemType = "entity" | "source" | "requirement"

/**
 * Hook that provides mapping diagram actions.
 *
 * Actions manipulate the diagram state through commands that update the store.
 * ConnectionLine components automatically react to state changes through the
 * diagramItems prop, eliminating the need for manual counter-based synchronization.
 */
export function useMappingActions() {

  const addDiagramItem = useCallback((itemId: string, itemType: ItemType, left: number, top: number) => {
    try {
      const exists = getObjectState().items.find((it) => it.itemId === itemId)
      if (exists) {
        if (exists.hidden) {
          setObjectState((prev) => ({
            ...prev,
            items: prev.items.map((it) => (it.itemId === itemId ? { ...it, hidden: false } : it)),
          }))
        }
        return
      }
      const newItem: DiagramItem = {
        itemId,
        itemType,
        left,
        top,
        hidden: false,
        collapsed: false,
        attributeFilter: "all",
        width: 200,
      }
      cmdAddDiagramItem(newItem)
    } catch (error) {
      console.error("Error adding diagram item:", error)
      toast.error("Failed to add item to diagram")
    }
  }, [])

  const hideDiagramItem = useCallback((itemId: string) => {
    try {
      cmdHideDiagramItem(itemId)
    } catch (error) {
      console.error("Error hiding diagram item:", error)
      toast.error("Failed to hide item")
    }
  }, [])

  const updatePosition = useCallback((itemId: string, left: number, top: number) => {
    try {
      cmdUpdateDiagramItemPosition(itemId, left, top)
    } catch (error) {
      console.error("Error updating item position:", error)
      toast.error("Failed to update position")
    }
  }, [])

  const updateWidth = useCallback((itemId: string, width: number) => {
    try {
      cmdUpdateDiagramItemWidth(itemId, width)
    } catch (error) {
      console.error("Error updating item width:", error)
      toast.error("Failed to update width")
    }
  }, [])

  const toggleCollapsed = useCallback((itemId: string) => {
    try {
      cmdToggleDiagramItemCollapsed(itemId)
    } catch (error) {
      console.error("Error toggling collapsed state:", error)
      toast.error("Failed to toggle collapsed state")
    }
  }, [])

  const setAttributeFilter = useCallback((itemId: string, filter: "all" | "mapped" | "unmapped" | "keys") => {
    try {
      cmdSetDiagramItemAttributeFilter(itemId, filter)
    } catch (error) {
      console.error("Error setting attribute filter:", error)
      toast.error("Failed to set attribute filter")
    }
  }, [])

  const addConnection = useCallback((connection: Connection) => {
    try {
      cmdAddConnection(connection)
    } catch (error) {
      console.error("Error adding connection:", error)
      toast.error("Failed to add connection")
    }
  }, [])

  const deleteConnection = useCallback((connectionId: string) => {
    try {
      cmdDeleteConnectionById(connectionId)
    } catch (error) {
      console.error("Error deleting connection:", error)
      toast.error("Failed to delete connection")
    }
  }, [])

  const addCustomAttribute = useCallback((itemId: string, attribute: Attribute) => {
    try {
      upsertCardAttribute(itemId, attribute.id, {
        name: attribute.name,
        isPrimaryKey: attribute.isPrimaryKey,
        isForeignKey: attribute.isForeignKey,
        isPII: attribute.isPII,
        dataType: attribute.dataType,
      })
    } catch (error) {
      console.error("Error adding custom attribute:", error)
      toast.error("Failed to add attribute")
    }
  }, [])

  const updateAttribute = useCallback((itemId: string, attrId: string, updates: Partial<Attribute>) => {
    try {
      const logicalUpdates: Partial<LogicalAttribute> = {}
      if (updates.name) logicalUpdates.name = updates.name
      if (Object.prototype.hasOwnProperty.call(updates, "isPrimaryKey"))
        logicalUpdates.isPrimaryKey = updates.isPrimaryKey
      if (Object.prototype.hasOwnProperty.call(updates, "isForeignKey"))
        logicalUpdates.isForeignKey = updates.isForeignKey
      if (Object.prototype.hasOwnProperty.call(updates, "isPII"))
        logicalUpdates.isPII = updates.isPII
      if (updates.dataType) logicalUpdates.dataType = updates.dataType

      cmdUpdateAttribute(attrId, logicalUpdates)
    } catch (error) {
      console.error("Error updating attribute:", error)
      toast.error("Failed to update attribute")
    }
  }, [])

  const deleteAttribute = useCallback((itemId: string, attrId: string) => {
    try {
      cmdDeleteAttribute(attrId)
    } catch (error) {
      console.error("Error deleting attribute:", error)
      toast.error("Failed to delete attribute")
    }
  }, [])

  const updateHandles = useCallback((itemId: string, height: number, handles: HandlePosition[]) => {
    try {
      cmdUpdateDiagramItemHandles(itemId, height, handles)
    } catch (error) {
      console.error("Error updating handles:", error)
      toast.error("Failed to update handles")
    }
  }, [])

  return {
    // Actions
    addDiagramItem,
    hideDiagramItem,
    updatePosition,
    updateWidth,
    toggleCollapsed,
    setAttributeFilter,
    addConnection,
    deleteConnection,
    addCustomAttribute,
    updateAttribute,
    deleteAttribute,
    updateHandles,
  }
}
