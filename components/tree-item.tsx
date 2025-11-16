"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import type { Entity, Source, Requirement, DiagramItem } from "@/lib/types"
import { normalizeStereotype, getStereotypeLabel } from "@/lib/utils"
import { useSettings } from "@/lib/use-settings"

interface TreeItemProps {
  item: Entity | Source | Requirement
  type: "entity" | "source" | "requirement"
  searchQuery: string
  diagramItems: DiagramItem[]
}

export function TreeItem({ item, type, searchQuery, diagramItems }: TreeItemProps) {
  const settings = useSettings()
  const [collapsed, setCollapsed] = useState(true)
  const prevSearchQuery = useRef(searchQuery)

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        itemId: item.id,
        itemType: type,
      }),
    )
  }

  const handleAttributeDragStart = (e: React.DragEvent, attrId: string, attrName: string) => {
    e.stopPropagation()
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "attribute",
        attrId,
        attrName,
        parentId: item.id,
        parentType: type,
      }),
    )
  }

  const hasAttributes = "attributes" in item && item.attributes && item.attributes.length > 0

  const query = searchQuery.toLowerCase()
  const itemName = "name" in item ? item.name : "table" in item ? item.table : ""

  const diagramItem = diagramItems.find((di) => di.itemId === item.id && di.itemType === type)
  const stereotypeId = normalizeStereotype(diagramItem?.objectType || ("stereotype" in item ? (item as any).stereotype : ""), settings?.entityStereotypes)
  const displayType = getStereotypeLabel(stereotypeId, settings?.entityStereotypes)

  const matchesItem = !query || itemName.toLowerCase().includes(query)
  const matchesStereotype = !query || displayType.toLowerCase().includes(query)
  const matchesAttr = hasAttributes && query && item.attributes.some((attr) => attr.name.toLowerCase().includes(query))
  const shouldShow = !query || matchesItem || matchesStereotype || matchesAttr

  useEffect(() => {
    if (query && (matchesAttr || matchesStereotype) && collapsed) {
      setCollapsed(false)
    }

    if (prevSearchQuery.current.trim() !== "" && searchQuery.trim() === "") {
      setCollapsed(true)
    }

    prevSearchQuery.current = searchQuery
  }, [matchesAttr, matchesStereotype, collapsed, searchQuery, query])

  if (!shouldShow) return null

  // Merge attributes from projection + diagram custom (to avoid temporary disappearing in Model)
  const baseEntityAttributes = (hasAttributes && type === "entity") ? (item as Entity).attributes : []
  const diagramForEntity = type === "entity" ? diagramItems.find((di) => di.itemId === item.id && di.itemType === "entity") : undefined
  const mergedEntityAttributes = (() => {
    if (type !== "entity") return [] as any[]
    // Wszystkie atrybuty są teraz w baseEntityAttributes (z projekcji)
    return baseEntityAttributes as any[]
  })()

  // Compute entity-level flags for consistent badges
  const entityAttributes = mergedEntityAttributes
  const entityHasPk = Array.isArray(entityAttributes) && entityAttributes.some((a: any) => a.isPrimaryKey)
  const entityHasPii = Array.isArray(entityAttributes) && entityAttributes.some((a: any) => a.isPII)

  return (
    <div>
      <div
        className={`py-1 px-2 my-0.5 rounded-md cursor-grab flex items-center justify-between gap-2 transition-colors ${
          (matchesItem || matchesStereotype) && query ? "bg-yellow-50" : "bg-white hover:bg-gray-50"
        }`}
        draggable
        onDragStart={handleDragStart}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {hasAttributes && (
            <button
              className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setCollapsed(!collapsed)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? "▶" : "▼"}
            </button>
          )}
          <div className="flex-1 min-w-0">
            {type === "entity" ? (
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs text-gray-900 truncate" title={"name" in item ? item.name : (item as any).name}>
                  {"name" in item ? item.name : (item as any).name}
                </span>
                {displayType && (
                  <span className="text-[11px] text-gray-500 shrink-0">{displayType}</span>
                )}
              </div>
            ) : (
              <>
                <div className="font-medium text-xs text-gray-900 truncate" title={"name" in item ? item.name : ("table" in (item as any) ? (item as any).table : (item as any).name)}>
                  {"name" in item ? item.name : "table" in item ? item.table : (item as any).name}
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                  {"database" in item
                    ? `${item.database}.${item.schema}`
                    : ((item as any).dataType || (item as any).description || "")}
                </div>
              </>
            )}
          </div>
        </div>
        {type === "entity" && (
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {!entityHasPk && <span className="text-xs text-red-600 bg-white px-1 py-0.5 rounded">No PK</span>}
            {entityHasPii && <span className="badge badge--pii">PII</span>}
          </div>
        )}
      </div>

      {hasAttributes && !collapsed && (
              <div className="ml-6 space-y-0.5">
          {(entityAttributes as any[]).map((attr) => {
            const attrMatches = query && attr.name.toLowerCase().includes(query)
            return (
              <div
                key={attr.id}
                className={`py-1 px-2 rounded-md cursor-grab text-xs transition-colors ${
                  attrMatches ? "bg-yellow-50 ring-1 ring-yellow-400" : "bg-white hover:bg-gray-50"
                }`}
                draggable
                onDragStart={(e) => handleAttributeDragStart(e, attr.id, attr.name)}
              >
                      <span className="text-gray-900 truncate" title={attr.name}>{attr.name}</span>
                <span className="inline-flex items-center gap-1 ml-2">
                  {(attr as any).isPrimaryKey ? (
                    <span title="PK" className="badge badge--pk">PK</span>
                  ) : null}
                  {(attr as any).isForeignKey ? (
                    <span title="FK" className="badge badge--fk">FK</span>
                  ) : null}
                  {(attr as any).isPII ? (
                    <span title="PII" className="badge badge--pii">PII</span>
                  ) : null}
                </span>
                      {(attr as any).dataType && (
                        <span className="ml-2 text-[10px] text-gray-500">{(attr as any).dataType}</span>
                      )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
