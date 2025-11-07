"use client"

import type React from "react"
import { useRef, useEffect, useState, useMemo, useCallback } from "react"
import { DiagramCard } from "./diagram-card"
import { RelationshipLine } from "./relationship-line"
import type { DiagramItem, Entity, Relationship, Attribute } from "@/lib/types"

interface ModelDiagramAreaProps {
  items: DiagramItem[]
  relationships: Relationship[]
  onAddItem: (item: DiagramItem) => void
  onHide: (itemId: string) => void
  onUpdatePosition: (itemId: string, left: number, top: number) => void
  onUpdateObjectType: (itemId: string, objectType: string) => void
  onUpdateWidth: (itemId: string, width: number) => void
  onDeleteRelationship: (relationshipId: string) => void
  onCreateRelationship: (sourceId: string, targetId: string) => void
  onUpdateRelationshipLabel: (id: string, label: string) => void
  onRequestEditRelationship: (rel: Relationship) => void
  onToggleCollapsed: (itemId: string) => void
  onSetAttributeFilter: (itemId: string, filter: "all" | "mapped" | "unmapped" | "keys") => void
  onAddCustomAttribute: (itemId: string, attribute: Attribute) => void
  onUpdateAttribute: (itemId: string, attrId: string, updates: Partial<Attribute>) => void
  onDeleteAttribute: (itemId: string, attrId: string) => void
  allEntities: Entity[]
}

export function ModelDiagramArea({
  items,
  relationships,
  onAddItem,
  onHide,
  onUpdatePosition,
  onUpdateObjectType,
  onUpdateWidth,
  onDeleteRelationship,
  onCreateRelationship,
  onUpdateRelationshipLabel,
  onRequestEditRelationship,
  onToggleCollapsed,
  onSetAttributeFilter,
  onAddCustomAttribute,
  onUpdateAttribute,
  onDeleteAttribute,
  allEntities,
}: ModelDiagramAreaProps) {
  const diagramRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null)
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null)

  // Oszacowanie rozmiaru płótna na podstawie pozycji/szerokości kart
  const canvasSize = useMemo(() => {
    const defaultCardWidth = 250
    const defaultCardHeight = 220
    const maxRight = items.length
      ? Math.max(...items.map((it) => (it.left || 0) + (it.width || defaultCardWidth)))
      : 0
    const maxBottom = items.length ? Math.max(...items.map((it) => (it.top || 0) + defaultCardHeight)) : 0
    const width = Math.max(1200, Math.ceil(maxRight + 200))
    const height = Math.max(800, Math.ceil(maxBottom + 200))
    return { width, height }
  }, [items])

  // Grupowanie relacji po parze encji (niedirected)
  const relationBundleIndex = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const rel of relationships) {
      const a = rel.sourceEntityId
      const b = rel.targetEntityId
      const key = a < b ? `${a}|${b}` : `${b}|${a}`
      const arr = map.get(key) || []
      arr.push(rel.id)
      map.set(key, arr)
    }
    // ustal stabilną kolejność w obrębie pary po id
    const indexMap = new Map<string, { index: number; count: number }>()
    for (const [, ids] of map) {
      ids.sort()
      const count = ids.length
      ids.forEach((id, i) => indexMap.set(id, { index: i, count }))
    }
    return indexMap
  }, [relationships])

  const clampZoom = (z: number) => Math.min(2, Math.max(0.5, z))

  const setZoomWithAnchor = (newZoom: number, anchorClientX?: number, anchorClientY?: number) => {
    const container = diagramRef.current
    if (!container) {
      setZoom(clampZoom(newZoom))
      return
    }
    const clamped = clampZoom(newZoom)
    const rect = container.getBoundingClientRect()
    const pointerX = anchorClientX != null ? anchorClientX : rect.left + rect.width / 2
    const pointerY = anchorClientY != null ? anchorClientY : rect.top + rect.height / 2
    const offsetX = pointerX - rect.left
    const offsetY = pointerY - rect.top
    const worldX = (container.scrollLeft + offsetX) / zoom
    const worldY = (container.scrollTop + offsetY) / zoom
    setZoom(clamped)
    const newScrollLeft = worldX * clamped - offsetX
    const newScrollTop = worldY * clamped - offsetY
    container.scrollLeft = Math.max(0, newScrollLeft)
    container.scrollTop = Math.max(0, newScrollTop)
  }

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.1 : -0.1
    setZoomWithAnchor(zoom + delta, e.clientX, e.clientY)
  }

  const handlePanMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!(e.nativeEvent as MouseEvent).getModifierState("Space")) return
    if (!diagramRef.current) return
    e.preventDefault()
    const container = diagramRef.current
    setIsPanning(true)
    panStartRef.current = { x: e.clientX, y: e.clientY, scrollLeft: container.scrollLeft, scrollTop: container.scrollTop }
  }

  const handlePanMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!isPanning || !diagramRef.current || !panStartRef.current) return
    e.preventDefault()
    const container = diagramRef.current
    const start = panStartRef.current
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    container.scrollLeft = start.scrollLeft - dx
    container.scrollTop = start.scrollTop - dy
  }

  const handlePanMouseUp: React.MouseEventHandler<HTMLDivElement> = () => {
    setIsPanning(false)
    panStartRef.current = null
  }

  // Keyboard: Delete/Esc
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedRelationshipId(null)
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedRelationshipId) {
        onDeleteRelationship(selectedRelationshipId)
        setSelectedRelationshipId(null)
      }
    },
    [selectedRelationshipId, onDeleteRelationship],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    // Debug: ile relacji renderujemy
    // eslint-disable-next-line no-console
    console.log("[ModelDiagramArea] relationships:", relationships.length)
  }, [relationships])

  useEffect(() => {
    const handleCreateRelationship = (e: CustomEvent) => {
      const { sourceId, targetId } = e.detail
      onCreateRelationship(sourceId, targetId)
    }

    window.addEventListener("create-relationship", handleCreateRelationship as EventListener)

    return () => {
      window.removeEventListener("create-relationship", handleCreateRelationship as EventListener)
    }
  }, [onCreateRelationship])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()

    try {
      const dataString = e.dataTransfer.getData("application/json")

      if (!dataString) {
        return
      }

      const data = JSON.parse(dataString)

      if (data.itemType === "entity") {
        const exists = items.some((item) => item.itemId === data.itemId)

        if (exists) {
          alert("The entity is already on the diagram.")
          return
        }

        if (diagramRef.current) {
          const rect = diagramRef.current.getBoundingClientRect()
          const left = (e.clientX - rect.left + diagramRef.current.scrollLeft - 125) / zoom
          const top = (e.clientY - rect.top + diagramRef.current.scrollTop - 50) / zoom

          const entity = allEntities.find((e) => e.id === data.itemId)

          const normalizeStereotype = (val?: string) => {
            const allowed = ["Object", "Link", "Dictionary", "Context", "Informative"]
            if (!val) return "Object"
            const n = val.trim()
            if (allowed.includes(n)) return n
            return "Object"
          }

          const newItem: DiagramItem = {
            itemId: data.itemId,
            itemType: "entity" as const,
            left: Math.max(0, left),
            top: Math.max(0, top),
            hidden: false,
            collapsed: false,
            objectType: normalizeStereotype(entity?.stereotype || "Object"),
          }

          onAddItem(newItem)
        }
      }
    } catch (error) {
      console.error("Error in handleDrop:", error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div
      ref={diagramRef}
      className={`flex-1 bg-white relative overflow-auto ${isPanning ? "cursor-grabbing" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onWheel={handleWheel}
      onMouseDown={handlePanMouseDown}
      onMouseMove={handlePanMouseMove}
      onMouseUp={handlePanMouseUp}
      onClick={() => setSelectedRelationshipId(null)}
    >
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-white/80 backdrop-blur rounded border border-gray-200 p-1 shadow-sm">
        <button className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50" onClick={() => setZoomWithAnchor(zoom + 0.1)} title="Zoom in (Ctrl +)">+</button>
        <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 min-w-[52px]" onClick={() => setZoomWithAnchor(1)} title="Reset zoom (Ctrl 0)">{Math.round(zoom * 100)}%</button>
        <button className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50" onClick={() => setZoomWithAnchor(zoom - 0.1)} title="Zoom out (Ctrl -)">−</button>
      </div>

      <div
        className="origin-top-left relative model-canvas"
        style={{ transform: `scale(${zoom})`, transformOrigin: "0 0", width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}
      >
        {items.map((item) => {
          const entity = allEntities.find((e) => e.id === item.itemId)

          if (!entity) {
            return null
          }

          return (
            <DiagramCard
              key={item.itemId}
              item={item}
              onHide={onHide}
              onUpdatePosition={onUpdatePosition}
              onAddConnection={() => {}}
              connections={[]}
              searchQuery=""
              onSelectAttribute={() => {}}
              onToggleCollapsed={onToggleCollapsed}
              onUpdateObjectType={onUpdateObjectType}
              onSetAttributeFilter={onSetAttributeFilter}
              onUpdateWidth={onUpdateWidth}
              onAddCustomAttribute={onAddCustomAttribute}
              onUpdateAttribute={onUpdateAttribute}
              onDeleteAttribute={onDeleteAttribute}
              onCreateRelationship={onCreateRelationship}
              allEntities={allEntities}
              allSources={[]}
              allRequirements={[]}
              mode="model"
              zoom={zoom}
            />
          )
        })}

        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 40 }}>
          {relationships
            .filter((relationship) => {
              const sourceItem = items.find(it => it.itemId === relationship.sourceEntityId)
              const targetItem = items.find(it => it.itemId === relationship.targetEntityId)
              return sourceItem?.hidden === false && targetItem?.hidden === false
            })
            .map((relationship) => {
              const bundle = relationBundleIndex.get(relationship.id)
              const multiIndex = bundle ? bundle.index : 0
              const multiCount = bundle ? bundle.count : 1
              return (
                <RelationshipLine
                  key={relationship.id}
                  relationship={relationship}
                  items={items}
                  onDelete={(id) => {
                    if (selectedRelationshipId === id) {
                      onDeleteRelationship(id)
                      setSelectedRelationshipId(null)
                    }
                  }}
                  zoom={zoom}
                  selected={selectedRelationshipId === relationship.id}
                  onSelect={() => setSelectedRelationshipId(relationship.id)}
                  onUpdateLabel={onUpdateRelationshipLabel}
                  multiIndex={multiIndex}
                  multiCount={multiCount}
                  onRequestEdit={(id) => {
                    if (selectedRelationshipId !== id) return
                    const rel = relationships.find((r) => r.id === id)
                    if (!rel) return
                    onRequestEditRelationship(rel)
                  }}
                />
              )
            })}
        </svg>

        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            Drag entities from the sidebar to start building your logical data model
          </div>
        )}
      </div>
    </div>
  )
}
