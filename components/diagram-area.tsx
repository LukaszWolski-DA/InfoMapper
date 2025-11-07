"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { DiagramCard } from "./diagram-card"
import { ConnectionLine } from "./connection-line"
import type { DiagramItem, Connection, Attribute, Entity, Source, Requirement } from "@/lib/types"

interface DiagramAreaProps {
  diagramItems: DiagramItem[]
  connections: Connection[]
  positionUpdateCounter?: number
  collapseCounter?: number
  activeView?: string
  onAddItem: (itemId: string, itemType: "entity" | "source" | "requirement", left: number, top: number) => void
  onHideItem: (itemId: string) => void
  onUpdatePosition: (itemId: string, left: number, top: number) => void
  onAddConnection: (connection: Connection) => void
  onDeleteConnection: (connectionId: string) => void
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
  // Nowe: pełna lista encji (projekcja z Object) do wykorzystania na diagramie
  entities?: Entity[]
  customEntities?: Entity[]
  customSources: Source[]
  customRequirements: Requirement[]
}

export function DiagramArea({
  diagramItems,
  connections,
  positionUpdateCounter,
  collapseCounter,
  activeView,
  onAddItem,
  onHideItem,
  onUpdatePosition,
  onAddConnection,
  onDeleteConnection,
  searchQuery,
  onSelectAttribute,
  onToggleCollapsed,
  onUpdateObjectType,
  onSetAttributeFilter,
  onUpdateWidth,
  onAddCustomAttribute,
  onUpdateAttribute,
  onDeleteAttribute,
  entities,
  customEntities,
  customSources,
  customRequirements,
}: DiagramAreaProps) {
  const diagramRef = useRef<HTMLDivElement>(null)
  const GRID_SIZE = 16
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null)

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "+" || e.key === "=")) {
        e.preventDefault()
        setZoomWithAnchor(zoom + 0.1)
      } else if (e.ctrlKey && e.key === "-") {
        e.preventDefault()
        setZoomWithAnchor(zoom - 0.1)
      } else if (e.ctrlKey && e.key === "0") {
        e.preventDefault()
        setZoomWithAnchor(1)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [zoom])

  const allEntities = entities || (customEntities || [])
  const allSources = customSources
  const allRequirements = customRequirements

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    try {
      const dataString = e.dataTransfer.getData("application/json")
      if (!dataString) {
        return
      }

      const data = JSON.parse(dataString)

      if (data.type === "attribute") {
        // Handle attribute drop (for creating connections)
        return
      }

      // Handle item drop (entity, source, requirement)
      if (data.itemId && data.itemType) {
        if (diagramRef.current) {
          const rect = diagramRef.current.getBoundingClientRect()
          let left = (e.clientX - rect.left + diagramRef.current.scrollLeft - 150) / zoom // world coords
          let top = (e.clientY - rect.top + diagramRef.current.scrollTop - 20) / zoom // world coords
          // Snap to grid
          left = Math.round(left / GRID_SIZE) * GRID_SIZE
          top = Math.round(top / GRID_SIZE) * GRID_SIZE
          onAddItem(data.itemId, data.itemType, left, top)
        }
      }
    } catch (err) {
      console.error("Error handling drop:", err)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const visibleItems = diagramItems.filter((item) => !item.hidden)
  const showInstructions = visibleItems.length === 0

  return (
    <div
      ref={diagramRef}
      className={`flex-1 bg-white relative overflow-auto mapping-scroll-container ${isPanning ? "cursor-grabbing" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onWheel={handleWheel}
      onMouseDown={handlePanMouseDown}
      onMouseMove={handlePanMouseMove}
      onMouseUp={handlePanMouseUp}
    >
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-white/80 backdrop-blur rounded border border-gray-200 p-1 shadow-sm">
        <button className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50" onClick={() => setZoomWithAnchor(zoom + 0.1)} title="Zoom in (Ctrl +)">+</button>
        <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 min-w-[52px]" onClick={() => setZoomWithAnchor(1)} title="Reset zoom (Ctrl 0)">{Math.round(zoom * 100)}%</button>
        <button className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50" onClick={() => setZoomWithAnchor(zoom - 0.1)} title="Zoom out (Ctrl -)">−</button>
      </div>

      {showInstructions && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">Instructions:</h3>
            <p className="mb-2">1. Drag entities from the left panel onto the diagram</p>
            <p className="mb-2">2. Drag attributes between entities to create mappings</p>
            <p className="mb-2">3. Click an attribute to view its dependencies</p>
            <p>4. Click "×" on a line to remove a mapping</p>
          </div>
        </div>
      )}

      <div className="origin-top-left mapping-canvas" style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
        {visibleItems.map((item) => (
          <DiagramCard
            key={item.itemId}
            item={item}
            onHide={onHideItem}
            onUpdatePosition={onUpdatePosition}
            onAddConnection={onAddConnection}
            connections={connections}
            searchQuery={searchQuery}
            onSelectAttribute={onSelectAttribute}
            onToggleCollapsed={onToggleCollapsed}
            onUpdateObjectType={onUpdateObjectType}
            onSetAttributeFilter={onSetAttributeFilter}
            onUpdateWidth={onUpdateWidth}
            onAddCustomAttribute={onAddCustomAttribute}
            onUpdateAttribute={onUpdateAttribute}
            onDeleteAttribute={onDeleteAttribute}
            allEntities={allEntities}
            allSources={allSources}
            allRequirements={allRequirements}
            zoom={zoom}
          />
        ))}

        {connections
          .filter((conn) => {
            const sourceItem = diagramItems.find(it => it.itemId === conn.source.itemId)
            const targetItem = diagramItems.find(it => it.itemId === conn.target.itemId)
            return sourceItem?.hidden === false && targetItem?.hidden === false
          })
          .map((connection) => (
            <ConnectionLine key={connection.id} connection={connection} onDelete={onDeleteConnection} zoom={zoom} positionUpdateCounter={positionUpdateCounter} collapseCounter={collapseCounter} activeView={activeView} />
          ))}
      </div>
    </div>
  )
}
