"use client"

import type React from "react"

import { useRef, useState, useEffect, memo } from "react"
import type { DiagramItem, Connection, Attribute, Entity, Source, Requirement } from "@/lib/types"
import { genLogicalAttributeId, genConnectionId } from "@/lib/id"
import { ImButton } from "./ui/im-button"
import { ImInput } from "./ui/im-input"
import { getSourceColumnTagBadge, type SourceColumnTag } from "@/lib/source-types"
import { useSettings } from "@/lib/use-settings"
import { getStereotypeLabel, getStereotypeColor } from "@/lib/utils"

interface DiagramCardProps {
  item: DiagramItem
  onHide: (itemId: string) => void
  onUpdatePosition: (itemId: string, left: number, top: number) => void
  onAddConnection: (connection: Connection) => void
  connections: Connection[]
  searchQuery: string
  onSelectAttribute: (
    attr: {
      itemId: string
      itemType: "entity" | "source" | "requirement"
      attrId: string
      attrName: string
    } | null,
  ) => void
  onToggleCollapsed: (itemId: string) => void
  onUpdateObjectType: (itemId: string, objectType: string) => void
  onSetAttributeFilter: (itemId: string, filter: "all" | "mapped" | "unmapped" | "keys") => void
  onUpdateWidth: (itemId: string, width: number) => void
  onAddCustomAttribute: (itemId: string, attribute: Attribute) => void
  onUpdateAttribute: (itemId: string, attrId: string, updates: Partial<Attribute>) => void
  onDeleteAttribute: (itemId: string, attrId: string) => void
  onUpdateHandles?: (itemId: string, height: number, handles: import("@/lib/types").HandlePosition[]) => void // Reports handle positions for connections
  onAttributeEditStateChange?: () => void // Triggers position update when attribute edit form opens/closes
  onCreateRelationship?: (sourceId: string, targetId: string) => void // Tylko dla trybu model
  allEntities: Entity[]
  allSources: Source[]
  allRequirements: Requirement[]
  mode?: "mapping" | "model"
  zoom?: number
}

const MIN_WIDTH = 200
const MAX_WIDTH = 600
const GRID_SIZE = 16

export const DiagramCard = memo(function DiagramCard({
  item,
  onHide,
  onUpdatePosition,
  onAddConnection,
  connections,
  searchQuery,
  onSelectAttribute,
  onToggleCollapsed,
  onUpdateObjectType,
  onSetAttributeFilter,
  onUpdateWidth,
  onAddCustomAttribute,
  onUpdateAttribute,
  onDeleteAttribute,
  onUpdateHandles,
  onAttributeEditStateChange,
  onCreateRelationship,
  allEntities,
  allSources,
  allRequirements,
  mode = "mapping",
  zoom = 1,
}: DiagramCardProps) {
  const settings = useSettings()
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isEditingType, setIsEditingType] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAttrName, setNewAttrName] = useState("")
  const [isPrimaryKey, setIsPrimaryKey] = useState(false)
  const [isForeignKey, setIsForeignKey] = useState(false)
  const [isPII, setIsPII] = useState(false)
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null)
  const [editAttrName, setEditAttrName] = useState("")
  const [editIsPrimaryKey, setEditIsPrimaryKey] = useState(false)
  const [editIsForeignKey, setEditIsForeignKey] = useState(false)
  const [editIsPII, setEditIsPII] = useState(false)
  const [editTags, setEditTags] = useState<SourceColumnTag[]>([])
  const [isRelationshipDragTarget, setIsRelationshipDragTarget] = useState(false)

  // Throttling drag updates to ~1/frame using requestAnimationFrame
  const pendingPositionRef = useRef<{ left: number; top: number } | null>(null)
  const rafIdRef = useRef<number | null>(null)

  // Trigger connection line position update when edit form opens/closes
  // The form element has data-attr-id so ConnectionLine can find it,
  // but we need to trigger recalculation because card height changes
  useEffect(() => {
    if (editingAttrId !== null) {
      // Form just opened - trigger update after short delay for DOM to settle
      const timer = setTimeout(() => {
        onAttributeEditStateChange?.()
      }, 50)
      return () => clearTimeout(timer)
    } else {
      // Form just closed - trigger update immediately
      onAttributeEditStateChange?.()
    }
  }, [editingAttrId, onAttributeEditStateChange])

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !cardRef.current) return

    const parent = cardRef.current.parentElement
    if (!parent) return

    const parentRect = parent.getBoundingClientRect()
    const newLeft = (e.clientX - parentRect.left - dragOffset.x + parent.scrollLeft) / zoom
    const newTop = (e.clientY - parentRect.top - dragOffset.y + parent.scrollTop) / zoom

    const snappedLeft = Math.round(Math.max(0, newLeft) / GRID_SIZE) * GRID_SIZE
    const snappedTop = Math.round(Math.max(0, newTop) / GRID_SIZE) * GRID_SIZE

    pendingPositionRef.current = { left: snappedLeft, top: snappedTop }
    if (rafIdRef.current == null) {
      rafIdRef.current = requestAnimationFrame(() => {
        const pos = pendingPositionRef.current
        if (pos) {
          onUpdatePosition(item.itemId, pos.left, pos.top)
        }
        rafIdRef.current = null
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!isResizing) return

    const deltaX = e.clientX - resizeStartX
    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStartWidth + deltaX))
    onUpdateWidth(item.itemId, newWidth)
  }

  const handleResizeMouseUp = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [isDragging, dragOffset, item.itemId, zoom])

  useEffect(() => {
    document.addEventListener("mousemove", handleResizeMouseMove)
    document.addEventListener("mouseup", handleResizeMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleResizeMouseMove)
      document.removeEventListener("mouseup", handleResizeMouseUp)
    }
  }, [isResizing, resizeStartX, resizeStartWidth, item.itemId])

  let data: any =
    item.itemType === "entity"
      ? allEntities.find((e) => e.id === item.itemId)
      : item.itemType === "source"
        ? allSources.find((s) => s.id === item.itemId)
        : allRequirements.find((r) => r.id === item.itemId)

  if (!data) {
    // Fallback dla wymagań (race: element upuszczony zanim lista wymagań się odświeży)
    if (item.itemType === "requirement") {
      const fallback: Requirement = { id: item.itemId, name: item.itemId, description: "", priority: "Custom", status: "Custom" }
      ;(allRequirements as Requirement[]).push(fallback)
      data = fallback
    } else {
      console.error(`[v0] Data not found for item ${item.itemId} of type ${item.itemType}`)
      console.error(`[v0] Available entities:`, allEntities.map(e => e.id))
      console.error(`[v0] Available sources:`, allSources.map(s => s.id))
      console.error(`[v0] Available requirements:`, allRequirements.map(r => r.id))
      return null
    }
  }

  const getItemDisplayName = (d: Entity | Source | Requirement): string => {
    return ("name" in d ? d.name : (d as Source).table) || ""
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement

    if (target.closest("button") || target.closest("[draggable='true']") || target.closest("select")) {
      return
    }

    setIsDragging(true)
    const rect = cardRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleCardDrop = (e: React.DragEvent) => {
    if (mode === "model") return

    e.preventDefault()
    e.stopPropagation()

    try {
      const dataString = e.dataTransfer.getData("application/json")
      if (!dataString) return

      const dragData = JSON.parse(dataString)
      const kind = dragData.type || dragData.itemType

      if (kind === "entity" || kind === "requirement") {
        const sourceName = kind === "requirement"
          ? (allRequirements.find((r) => r.id === (dragData.itemId || dragData.id))?.name || dragData.name || dragData.itemId)
          : (dragData.name || dragData.itemId)
        const connection: Connection = {
          id: genConnectionId(),
          type:
            kind === "requirement" || item.itemType === "requirement"
              ? "requirement-mapping"
              : "attribute-mapping",
          source: {
            attrId: "",
            attrName: sourceName,
            parentId: dragData.itemId || dragData.id,
            parentType: kind,
            itemId: dragData.itemId || dragData.id,
          },
          target: {
            attrId: "",
            attrName: getItemDisplayName(data as any),
            parentId: item.itemId,
            parentType: item.itemType,
            itemId: item.itemId,
          },
        }
        onAddConnection(connection)
      } else if (kind === "attribute") {
        const connection: Connection = {
          id: genConnectionId(),
          type: item.itemType === "requirement" ? "requirement-mapping" : "attribute-mapping",
          source: {
            attrId: dragData.attrId,
            attrName: dragData.attrName,
            parentId: dragData.parentId,
            parentType: dragData.parentType,
            itemId: dragData.parentId,
          },
          target: {
            attrId: "",
            attrName: getItemDisplayName(data as any),
            parentId: item.itemId,
            parentType: item.itemType,
            itemId: item.itemId,
          },
        }
        onAddConnection(connection)
      }
    } catch (err) {
      console.error("Error handling card drop:", err)
    }
  }

  const handleAttributeDrop = (e: React.DragEvent, targetAttrId: string, targetAttrName: string) => {
    if (mode === "model") return

    e.preventDefault()
    e.stopPropagation()

    try {
      const dataString = e.dataTransfer.getData("application/json")
      if (!dataString) return

      const dragData = JSON.parse(dataString)
      const kind = dragData.type || dragData.itemType

      if (kind === "attribute" && dragData.attrId !== targetAttrId) {
        const connection: Connection = {
          id: genConnectionId(),
          type: "attribute-mapping",
          source: {
            attrId: dragData.attrId,
            attrName: dragData.attrName,
            parentId: dragData.parentId,
            parentType: dragData.parentType,
            itemId: dragData.parentId,
          },
          target: {
            attrId: targetAttrId,
            attrName: targetAttrName,
            parentId: item.itemId,
            parentType: item.itemType,
            itemId: item.itemId,
          },
        }
        onAddConnection(connection)
      } else if (kind === "entity" || kind === "requirement") {
        const sourceName = kind === "requirement"
          ? (allRequirements.find((r) => r.id === (dragData.itemId || dragData.id))?.name || dragData.name || dragData.itemId)
          : (dragData.name || dragData.itemId)
        const connection: Connection = {
          id: genConnectionId(),
          type: kind === "requirement" ? "requirement-mapping" : "attribute-mapping",
          source: {
            attrId: "",
            attrName: sourceName,
            parentId: dragData.itemId || dragData.id,
            parentType: kind,
            itemId: dragData.itemId || dragData.id,
          },
          target: {
            attrId: targetAttrId,
            attrName: targetAttrName,
            parentId: item.itemId,
            parentType: item.itemType,
            itemId: item.itemId,
          },
        }
        onAddConnection(connection)
      }
    } catch (err) {
      console.error("Error handling attribute drop:", err)
    }
  }

  const handleRelationshipDragStart = (e: React.DragEvent) => {
    if (mode !== "model") return

    e.stopPropagation()
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "relationship-source",
        sourceEntityId: item.itemId,
      }),
    )
  }

  const handleRelationshipDrop = (e: React.DragEvent) => {
    if (mode !== "model") return

    e.preventDefault()
    e.stopPropagation()
    setIsRelationshipDragTarget(false)

    try {
      const dataString = e.dataTransfer.getData("application/json")
      if (!dataString) return

      const dragData = JSON.parse(dataString)

      if (dragData.type === "relationship-source" && dragData.sourceEntityId !== item.itemId) {
        // Trigger relationship creation dialog
        if (onCreateRelationship) {
          onCreateRelationship(dragData.sourceEntityId, item.itemId)
        }
      }
    } catch (err) {
      console.error("Error handling relationship drop:", err)
    }
  }

  const handleRelationshipDragOver = (e: React.DragEvent) => {
    if (mode !== "model") return

    e.preventDefault()
    e.stopPropagation()

    try {
      const dataString = e.dataTransfer.getData("application/json")
      if (dataString) {
        const dragData = JSON.parse(dataString)
        if (dragData.type === "relationship-source" && dragData.sourceEntityId !== item.itemId) {
          setIsRelationshipDragTarget(true)
        }
      }
    } catch (err) {
      // Ignore parsing errors
    }
  }

  const handleRelationshipDragLeave = () => {
    if (mode !== "model") return
    setIsRelationshipDragTarget(false)
  }

  const hasAttributes = data && "attributes" in data && (data as any).attributes
  const isRequirement = item.itemType === "requirement"
  const isEntity = item.itemType === "entity"
  const query = searchQuery.toLowerCase()

  const isEntityMapped = connections.some(
    (conn) =>
      (conn.source.itemId === item.itemId && conn.source.attrId === "") ||
      (conn.target.itemId === item.itemId && conn.target.attrId === ""),
  )

  const filterMode = item.attributeFilter || "all"

  // Nowy system: atrybuty pochodzą wyłącznie z projekcji (data.attributes)
  // Nie ma już customAttributes, attributeOverrides ani hiddenAttributes
  const allAttributes: Attribute[] = hasAttributes
    ? (data.attributes as Attribute[])
    : []

  const displayedAttributes: Attribute[] =
    allAttributes.length > 0
      ? (() => {
          if (filterMode === "all") {
            return allAttributes
          } else if (filterMode === "mapped") {
            return allAttributes.filter((attr) =>
              connections.some((conn) => conn.source.attrId === attr.id || conn.target.attrId === attr.id),
            )
          } else if (filterMode === "keys") {
            return allAttributes.filter((attr) => attr.isPrimaryKey || attr.isForeignKey)
          } else {
            return allAttributes.filter(
              (attr) => !connections.some((conn) => conn.source.attrId === attr.id || conn.target.attrId === attr.id),
            )
          }
        })()
      : []

  const hiddenCount = allAttributes.length - displayedAttributes.length

  // Calculate and report handle positions whenever card layout changes
  // HYBRID APPROACH: Use DOM measurements for accurate handle positioning
  // This ensures handles align with actual rendered badge positions
  useEffect(() => {
    if (!onUpdateHandles || !cardRef.current) return

    // Use requestAnimationFrame to ensure DOM is fully updated
    const rafId = requestAnimationFrame(() => {
      if (!cardRef.current) return

      const cardRect = cardRef.current.getBoundingClientRect()
      const cardHeight = cardRect.height
      const handles: import("@/lib/types").HandlePosition[] = []

      if (allAttributes.length > 0 && !item.collapsed) {
        const cardWidth = item.width || 200

        // Calculate handles only for DISPLAYED attributes (respects filters)
        // This ensures we don't create handles for hidden/filtered attributes
        displayedAttributes.forEach((attr) => {
          // Try to measure actual DOM element position
          const attrElement = cardRef.current!.querySelector(`[data-attr-id="${attr.id}"]`)

          if (attrElement) {
            // DOM-based measurement (most accurate)
            const attrRect = attrElement.getBoundingClientRect()
            const relativeY = attrRect.top - cardRect.top + (attrRect.height / 2)
            const absoluteY = item.top + relativeY

            // Use actual attribute box dimensions from DOM for precise anchor positioning
            // This accounts for varying card widths and attribute content
            const attrRelativeLeft = attrRect.left - cardRect.left
            const attrRelativeRight = attrRect.right - cardRect.left

            const leftHandleX = item.left + attrRelativeLeft // Left edge of actual attribute box
            const rightHandleX = item.left + attrRelativeRight // Right edge of actual attribute box

            handles.push(
              {
                attrId: attr.id,
                side: 'left' as const,
                x: leftHandleX,
                y: absoluteY,
              },
              {
                attrId: attr.id,
                side: 'right' as const,
                x: rightHandleX,
                y: absoluteY,
              }
            )
          } else {
            // FALLBACK: Mathematical approximation if DOM element not found
            // This can happen during initial render or if attribute is filtered out
            const headerHeight = 140 // Approximate: title + subtitle + filters + margins
            const attributeRowHeight = 41 // Approximate row height
            const index = allAttributes.indexOf(attr)
            const relativeY = headerHeight + (index * attributeRowHeight) + (attributeRowHeight / 2)
            const absoluteY = item.top + relativeY

            // Anchors should align with attribute box edges
            // TRUE SYMMETRIC: both sides with equal padding offset
            const cardPadding = 16 // p-4 = 16px on all sides

            handles.push(
              {
                attrId: attr.id,
                side: 'left' as const,
                x: item.left + cardPadding,
                y: absoluteY,
              },
              {
                attrId: attr.id,
                side: 'right' as const,
                x: item.left + cardWidth - cardPadding,
                y: absoluteY,
              }
            )
          }
        })
      }

      onUpdateHandles(item.itemId, cardHeight, handles)
    })

    return () => cancelAnimationFrame(rafId)
  }, [
    item.itemId,
    item.left,
    item.top,
    item.width,
    item.collapsed,
    item.attributeFilter,
    item.itemType,
    onUpdateHandles,
    allEntities,
    allSources,
    allRequirements,
  ])

  const displaySubtitle = () => {
    if (isEntity) {
      if (isEditingType) {
        return (
          <select
            value={cardStereotypeId || ""}
            onChange={(e) => {
              onUpdateObjectType(item.itemId, e.target.value)
              setIsEditingType(false)
            }}
            onBlur={() => setIsEditingType(false)}
            autoFocus
            className="text-xs text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-400"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">Select type...</option>
            {(settings?.entityStereotypes || []).map((stereotype) => (
              <option key={stereotype.id} value={stereotype.id}>
                {stereotype.label}
              </option>
            ))}
          </select>
        )
      }

      return (
        <div
          className="text-xs text-gray-600 cursor-pointer hover:text-gray-800 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
          onDoubleClick={(e) => {
            e.stopPropagation()
            setIsEditingType(true)
          }}
          title="Double-click to edit object type"
        >
          {getStereotypeLabel(cardStereotypeId, settings?.entityStereotypes)}
        </div>
      )
    }

    return (
      <div className="text-xs text-gray-600">
        {data && ("stereotype" in data)
          ? getStereotypeLabel((data as any).stereotype, settings?.entityStereotypes)
          : data && ("database" in data)
            ? `${(data as any).database}.${(data as any).schema}`
            : (data as any)?.description}
      </div>
    )
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeStartX(e.clientX)
    setResizeStartWidth(item.width || 250)
  }

  const handleEditAttribute = (attr: Attribute) => {
    setEditingAttrId(attr.id)
    setEditAttrName(attr.name)
    setEditIsPrimaryKey(!!attr.isPrimaryKey)
    setEditIsForeignKey(!!attr.isForeignKey)
    setEditIsPII(attr.isPII || false)
    setEditTags((attr.tags as SourceColumnTag[]) || [])
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editAttrName.trim() || !editingAttrId) return

    if (item.itemType === "source") {
      // For sources, update tags in localStorage
      try {
        const raw = localStorage.getItem("infoMapperSourcesV1")
        if (raw) {
          const sourcesData = JSON.parse(raw)

          // Find the source object
          for (const obj of sourcesData.objects) {
            const col = obj.columns.find((c: any) => c.id === editingAttrId)
            if (col) {
              col.tags = editTags
              break
            }
          }

          localStorage.setItem("infoMapperSourcesV1", JSON.stringify(sourcesData))
          window.dispatchEvent(new CustomEvent("sources-data-updated"))
        }
      } catch (e) {
        console.error("Failed to save source tags:", e)
      }
    } else {
      // For entities, update via store
      const updates: Partial<Attribute> = {
        name: editAttrName.trim(),
        nameEn: editAttrName.trim(),
        stereotype: editIsPrimaryKey ? "PK" : editIsForeignKey ? "FK" : "Attribute",
        isPrimaryKey: editIsPrimaryKey,
        isForeignKey: editIsForeignKey,
        isPII: editIsPII,
      }

      onUpdateAttribute(item.itemId, editingAttrId, updates)
    }

    setEditingAttrId(null)
    setEditAttrName("")
    setEditIsPrimaryKey(false)
    setEditIsForeignKey(false)
    setEditIsPII(false)
    setEditTags([])
  }

  const handleDeleteAttribute = (attrId: string, attrName: string) => {
    if (window.confirm(`Are you sure you want to delete the attribute "${attrName}"?`)) {
      onDeleteAttribute(item.itemId, attrId)
      setEditingAttrId(null)
      // Event już nie jest potrzebny - onDeleteAttribute wywołuje bezpośrednio komendę do store
    }
  }

  const handleAddAttribute = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAttrName.trim()) return

    const generatedId = genLogicalAttributeId()
    const newAttribute: Attribute = {
      id: generatedId,
      name: newAttrName.trim(),
      nameEn: newAttrName.trim(),
      stereotype: isPrimaryKey ? "PK" : isForeignKey ? "FK" : "Attribute",
      isPrimaryKey: isPrimaryKey,
      isForeignKey: isForeignKey,
      isPII: isPII,
    }

    // Dodaj atrybut przez callback, który wywołuje komendę do store
    onAddCustomAttribute(item.itemId, newAttribute)
    // Event już nie jest potrzebny - onAddCustomAttribute wywołuje bezpośrednio komendę do store

    setNewAttrName("")
    setIsPrimaryKey(false)
    setIsForeignKey(false)
    setIsPII(false)
    setShowAddForm(false)
  }

  // Get stereotype ID from item or entity data
  const cardStereotypeId = item.itemType === "entity" ? (item.objectType || ((data as any)?.stereotype as string) || "object") : undefined

  const getCardBackgroundColor = () => {
    if (item.itemType === "entity" && cardStereotypeId) {
      const colorClasses = getStereotypeColor(cardStereotypeId, settings?.entityStereotypes)
      return colorClasses.split(" ")[0] || "bg-white"
    }
    return "bg-white"
  }

  const getBorderColor = () => {
    if (item.itemType === "entity" && cardStereotypeId) {
      const colorClasses = getStereotypeColor(cardStereotypeId, settings?.entityStereotypes)
      return colorClasses.split(" ")[1] || "border-gray-300"
    }
    return item.itemType === "entity"
      ? "border-green-400"
      : item.itemType === "source"
        ? "border-blue-400"
        : "border-purple-400"
  }

  return (
    <div
      ref={cardRef}
      className={`absolute rounded-lg border p-4 min-w-[250px] cursor-move transition-shadow hover:shadow-lg active:shadow-xl ${
        isDragging ? "shadow-xl select-none" : "shadow-md"
      } ${getCardBackgroundColor()} ${getBorderColor()} ${
        isRelationshipDragTarget ? "ring-4 ring-blue-400" : "hover:ring-1 hover:ring-gray-200 focus-within:ring-2 focus-within:ring-gray-300 focus-within:ring-offset-1"
      }`}
      style={{
        left: `${item.left}px`,
        top: `${item.top}px`,
        width: `${item.width || 250}px`,
        zIndex: 10,
      }}
      onMouseDown={handleMouseDown}
      data-item-id={item.itemId}
      data-collapsed={item.collapsed ? "true" : "false"}
    >
      <div
        className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize hover:bg-gray-200 transition-colors"
        onMouseDown={handleResizeMouseDown}
        title="Drag to resize"
      />

      {/* Row 1: Filters bar (mode-specific) */}
      <div className="mb-2 flex items-center justify-between">
        {mode === "model" && (
          <div className="flex items-center border border-gray-300 rounded overflow-hidden">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSetAttributeFilter(item.itemId, "all")
              }}
              className={`text-xs px-2 py-1 transition-colors ${
                (item.attributeFilter || "all") === "all" ? "bg-gray-200 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-100"
              }`}
              title="Show all attributes"
            >
              All
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSetAttributeFilter(item.itemId, "keys")
              }}
              className={`text-xs px-2 py-1 border-l border-gray-300 transition-colors ${
                item.attributeFilter === "keys" ? "bg-indigo-100 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-100"
              }`}
              title="Show only PK/FK"
            >
              Keys
            </button>
          </div>
        )}
        {mode === "mapping" && item.itemType !== "requirement" && (
          <div className="flex items-center border border-gray-300 rounded overflow-hidden">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSetAttributeFilter(item.itemId, "all")
              }}
              className={`text-xs px-2 py-1 transition-colors ${
                (item.attributeFilter || "all") === "all" ? "bg-gray-200 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-100"
              }`}
              title="Show all attributes"
            >
              All
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSetAttributeFilter(item.itemId, "mapped")
              }}
              className={`text-xs px-2 py-1 border-l border-gray-300 transition-colors ${
                item.attributeFilter === "mapped" ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"
              }`}
              title="Show only mapped attributes"
            >
              Mapped
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSetAttributeFilter(item.itemId, "unmapped")
              }}
              className={`text-xs px-2 py-1 border-l border-gray-300 transition-colors ${
                item.attributeFilter === "unmapped" ? "bg-orange-100 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-100"
              }`}
              title="Show only unmapped attributes"
            >
              Unmapped
            </button>
          </div>
        )}
      </div>

      {/* Row 2: Title + collapse button (if has attributes) */}
      <div className="mb-2 pb-2 border-b border-gray-200 flex items-center justify-between">
        <div
          className="font-semibold text-base cursor-grab"
          draggable={mode === "model" || isRequirement}
          data-entity-name="true"
          onDragStart={(e) => {
            if (mode === "model") {
              handleRelationshipDragStart(e)
            } else if (isRequirement) {
              e.stopPropagation()
              e.dataTransfer.setData(
                "application/json",
                JSON.stringify({
                  type: "requirement",
                  itemId: item.itemId,
                  itemType: item.itemType,
                  name: ("name" in data ? data.name : "table" in data ? data.table : (data as any).name) as string,
                }),
              )
            }
          }}
          onDrop={mode === "model" ? handleRelationshipDrop : mode === "mapping" ? handleCardDrop : undefined}
          onDragOver={mode === "model" ? handleRelationshipDragOver : mode === "mapping" ? (e) => e.preventDefault() : undefined}
          onDragLeave={mode === "model" ? handleRelationshipDragLeave : undefined}
        >
          <span className="text-gray-900">{getItemDisplayName(data as any)}</span>
        </div>
        {hasAttributes && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapsed(item.itemId)
            }}
            className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
            title={item.collapsed ? "Expand" : "Collapse"}
          >
            {item.collapsed ? "▶" : "▼"}
          </button>
        )}
      </div>

      <div className="mb-3">{displaySubtitle()}</div>

      {hasAttributes && !item.collapsed && (
        <>
          <div className="space-y-1 mb-3">
            {displayedAttributes.length === 0 && (
              <div className="text-xs text-gray-400 italic">{filterMode === "keys" ? "No keys" : "No attributes"}</div>
            )}
            {displayedAttributes.map((attr) => {
              const isMapped = connections.some((conn) => conn.source.attrId === attr.id || conn.target.attrId === attr.id)
              const attrMatches = query && attr.name.toLowerCase().includes(query)

              if (editingAttrId === attr.id) {
                return (
                  <form
                    key={attr.id}
                    data-attr-id={attr.id}
                    onSubmit={handleSaveEdit}
                    className="p-3 bg-gray-50 rounded-md border border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-2">
                      <ImInput
                        type="text"
                        value={editAttrName}
                        onChange={(e) => setEditAttrName(e.target.value)}
                        placeholder="Attribute name"
                        autoFocus
                        disabled={item.itemType === "source"}
                      />
                    </div>

                    {/* Conditional rendering based on item type */}
                    {item.itemType === "source" ? (
                      // Source tags checkboxes
                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-2">Tags:</div>
                        <div className="grid grid-cols-2 gap-2">
                          {(["BusinessKey", "LinkBusinessKey", "ChildKey", "DictionaryKey", "DictionaryChildKey", "PIIAttribute"] as SourceColumnTag[]).map(tag => {
                            const { label, color } = getSourceColumnTagBadge(tag, settings.sourceColumnTags)
                            const isSelected = editTags.includes(tag)
                            return (
                              <label key={tag} className="flex items-center text-xs cursor-pointer" title={tag}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditTags([...editTags, tag])
                                    } else {
                                      setEditTags(editTags.filter(t => t !== tag))
                                    }
                                  }}
                                  className="mr-1.5"
                                />
                                <span className={`px-1.5 py-0.5 rounded border ${isSelected ? color : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                  {label}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      // Entity PK/FK/PII checkboxes
                      <div className="flex items-center gap-3 mb-3">
                        <label className="flex items-center text-xs text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsPrimaryKey}
                            onChange={(e) => setEditIsPrimaryKey(e.target.checked)}
                            className="mr-1.5"
                          />
                          Primary Key
                        </label>
                        <label className="flex items-center text-xs text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsForeignKey}
                            onChange={(e) => setEditIsForeignKey(e.target.checked)}
                            className="mr-1.5"
                          />
                          Foreign Key
                        </label>
                        <label className="flex items-center text-xs text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsPII}
                            onChange={(e) => setEditIsPII(e.target.checked)}
                            className="mr-1.5"
                          />
                          Is PII
                        </label>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <ImButton
                        type="submit"
                        variant="success"
                      >
                        Save
                      </ImButton>
                      <ImButton
                        type="button"
                        variant="neutral"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingAttrId(null)
                        }}
                      >
                        Cancel
                      </ImButton>
                      {item.itemType !== "source" && (
                        <ImButton
                          type="button"
                          variant="danger"
                          className="ml-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteAttribute(attr.id, attr.name)
                          }}
                        >
                          Delete
                        </ImButton>
                      )}
                    </div>
                  </form>
                )
              }

              return (
                <div
                  key={attr.id}
                  className={`p-2 rounded-md text-sm flex items-center justify-between cursor-pointer transition-colors ${
                    attr.isPII
                      ? "bg-violet-50 border border-violet-200"
                      : isMapped
                        ? "bg-green-50 border border-green-200"
                        : "bg-gray-50 border border-gray-200"
                  }`}
                  draggable={mode === "mapping"}
                  onDragStart={(e) => {
                    if (mode === "mapping") {
                      e.stopPropagation()
                      e.dataTransfer.setData(
                        "application/json",
                        JSON.stringify({ type: "attribute", attrId: attr.id, attrName: attr.name, parentId: item.itemId, parentType: item.itemType }),
                      )
                    }
                  }}
                  onDrop={mode === "mapping" ? (e) => handleAttributeDrop(e, attr.id, attr.name) : undefined}
                  onDragOver={mode === "mapping" ? (e) => e.preventDefault() : undefined}
                  onClick={(e) => {
                    if (mode === "mapping") {
                      e.stopPropagation()
                      onSelectAttribute({ itemId: item.itemId, itemType: item.itemType, attrId: attr.id, attrName: attr.name })
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    handleEditAttribute(attr)
                  }}
                  data-attr-id={attr.id}
                  data-attr-name={(attr as any).name}
                  title="Double-click to edit"
                >
                  <span className="flex-1 text-gray-700">{attr.name}</span>
                  <div className="flex items-center gap-1 ml-2">
                    {/* Badge order: PK → FK → PII → Source Tags; supports showing all at once */}
                    {attr.isPrimaryKey && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">PK</span>
                    )}
                    {attr.isForeignKey && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">FK</span>
                    )}
                    {attr.isPII && (
                      <span className="text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded border border-pink-200">PII</span>
                    )}
                    {/* Source column tags (only for source items) */}
                    {item.itemType === "source" && attr.tags && attr.tags.length > 0 && (
                      <>
                        {attr.tags.map((tag) => {
                          const { label, color } = getSourceColumnTagBadge(tag as string, settings.sourceColumnTags)
                          return (
                            <span
                              key={tag}
                              className={`text-xs px-1.5 py-0.5 rounded border ${color}`}
                              title={tag}
                            >
                              {label}
                            </span>
                          )
                        })}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {hiddenCount > 0 && (
            <div className="text-xs text-gray-500 italic mb-3">
              {hiddenCount} {filterMode === "mapped" ? "unmapped" : filterMode === "unmapped" ? "mapped" : ""} attribute
              {hiddenCount > 1 ? "s" : ""} hidden
            </div>
          )}
          {showAddForm && (
            <form onSubmit={handleAddAttribute} className="mb-3 p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="mb-2">
                <ImInput
                  type="text"
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  placeholder="Attribute name"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimaryKey}
                    onChange={(e) => setIsPrimaryKey(e.target.checked)}
                    className="mr-1.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  Primary Key
                </label>
                <label className="flex items-center text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isForeignKey}
                    onChange={(e) => setIsForeignKey(e.target.checked)}
                    className="mr-1.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  Foreign Key
                </label>
                <label className="flex items-center text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPII}
                    onChange={(e) => setIsPII(e.target.checked)}
                    className="mr-1.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  Is PII
                </label>
              </div>
              <div className="flex gap-2">
                <ImButton
                  type="submit"
                  variant="success"
                  onClick={(e) => e.stopPropagation()}
                >
                  Add
                </ImButton>
                <ImButton
                  type="button"
                  variant="neutral"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAddForm(false)
                    setNewAttrName("")
                    setIsPrimaryKey(false)
                    setIsForeignKey(false)
                    setIsPII(false)
                  }}
                >
                  Cancel
                </ImButton>
              </div>
            </form>
          )}
        </>
      )}

      <div className="flex gap-2">
        {hasAttributes && !item.collapsed && !showAddForm && item.itemType !== "source" && (
          <ImButton
            variant="primary"
            onClick={(e) => {
              e.stopPropagation()
              setShowAddForm(true)
            }}
          >
            Add
          </ImButton>
        )}
        <button
          onClick={() => onHide(item.itemId)}
          className="text-xs px-2 py-0.5 bg-white text-black rounded hover:bg-gray-50 transition-colors border border-gray-300"
        >
          Hide
        </button>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if these specific props change
  // Return true if props are equal (don't re-render), false if different (re-render)
  return (
    prevProps.item === nextProps.item &&
    prevProps.connections === nextProps.connections &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.mode === nextProps.mode &&
    prevProps.allEntities === nextProps.allEntities &&
    prevProps.allSources === nextProps.allSources &&
    prevProps.allRequirements === nextProps.allRequirements
  )
})
