"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import type { DiagramItem, Connection, Attribute, Entity, Source, Requirement } from "@/lib/types"
import { genLogicalAttributeId, genConnectionId } from "@/lib/id"
import { ImButton } from "./ui/im-button"
import { ImInput } from "./ui/im-input"

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
  onCreateRelationship?: (sourceId: string, targetId: string) => void // Tylko dla trybu model
  allEntities: Entity[]
  allSources: Source[]
  allRequirements: Requirement[]
  mode?: "mapping" | "model"
  zoom?: number
}

const OBJECT_TYPES = ["Object", "Dictionary", "Link", "Context", "Informative"]
const MIN_WIDTH = 200
const MAX_WIDTH = 600
const GRID_SIZE = 16

const OBJECT_TYPE_COLORS: Record<string, string> = {
  Object: "bg-blue-50 border-blue-200",
  Link: "bg-teal-50 border-teal-200",
  Context: "bg-amber-50 border-amber-200",
  Dictionary: "bg-green-50 border-green-200",
  Informative: "bg-gray-50 border-gray-200",
}

export function DiagramCard({
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
  onCreateRelationship,
  allEntities,
  allSources,
  allRequirements,
  mode = "mapping",
  zoom = 1,
}: DiagramCardProps) {
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
  const [isRelationshipDragTarget, setIsRelationshipDragTarget] = useState(false)

  // Throttling drag updates to ~1/frame using requestAnimationFrame
  const pendingPositionRef = useRef<{ left: number; top: number } | null>(null)
  const rafIdRef = useRef<number | null>(null)

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

  const displaySubtitle = () => {
    if (isEntity) {
      if (isEditingType) {
        return (
          <select
            value={cardObjectType || ""}
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
            {OBJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
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
          {cardObjectType || "<Object Type>"}
        </div>
      )
    }

    return (
      <div className="text-xs text-gray-600">
        {data && ("stereotype" in data)
          ? (data as any).stereotype
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
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editAttrName.trim() || !editingAttrId) return

    const updates: Partial<Attribute> = {
      name: editAttrName.trim(),
      nameEn: editAttrName.trim(),
      stereotype: editIsPrimaryKey ? "PK" : editIsForeignKey ? "FK" : "Attribute",
      isPrimaryKey: editIsPrimaryKey,
      isForeignKey: editIsForeignKey,
      isPII: editIsPII,
    }

    onUpdateAttribute(item.itemId, editingAttrId, updates)
    // Event już nie jest potrzebny - onUpdateAttribute wywołuje bezpośrednio komendę do store

    setEditingAttrId(null)
    setEditAttrName("")
    setEditIsPrimaryKey(false)
    setEditIsForeignKey(false)
    setEditIsPII(false)
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

  const cardObjectType = item.itemType === "entity" ? (item.objectType || ((data as any)?.stereotype as string) || "Object") : undefined

  const getCardBackgroundColor = () => {
    if (item.itemType === "entity" && cardObjectType) {
      return OBJECT_TYPE_COLORS[cardObjectType] || "bg-white"
    }
    return "bg-white"
  }

  const getBorderColor = () => {
    if (item.itemType === "entity" && cardObjectType) {
      // Extract border color from the object type colors
      const colorClass = OBJECT_TYPE_COLORS[cardObjectType]
      return colorClass ? colorClass.split(" ")[1] : "border-green-400"
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
                      />
                    </div>
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
                  {/* Badge order: PK → FK → PII; supports showing all at once */}
                  {attr.isPrimaryKey && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-2">PK</span>
                  )}
                  {attr.isForeignKey && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded ml-1">FK</span>
                  )}
                  {attr.isPII && (
                    <span className="text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded ml-1">PII</span>
                  )}
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
        {hasAttributes && !item.collapsed && !showAddForm && (
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
}
