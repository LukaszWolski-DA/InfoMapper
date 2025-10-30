"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { Relationship, DiagramItem } from "@/lib/types"

interface RelationshipLineProps {
  relationship: Relationship
  items: DiagramItem[]
  onDelete: (relationshipId: string) => void
  zoom?: number
  selected?: boolean
  onSelect?: () => void
  onUpdateLabel?: (relationshipId: string, newLabel: string) => void
  multiIndex?: number
  multiCount?: number
  onRequestEdit?: (relationshipId: string) => void
}

export function RelationshipLine({ relationship, items, onDelete, zoom = 1, selected = false, onSelect, onUpdateLabel, multiIndex = 0, multiCount = 1, onRequestEdit }: RelationshipLineProps) {
  const [lineCoords, setLineCoords] = useState<{
    x1: number
    y1: number
    x2: number
    y2: number
    midX: number
    midY: number
    sourceCardinalityX: number
    sourceCardinalityY: number
    targetCardinalityX: number
    targetCardinalityY: number
  } | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isHover, setIsHover] = useState(false)
  const [editValue, setEditValue] = useState(relationship.label)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const labelTextRef = useRef<SVGTextElement | null>(null)
  const [labelSize, setLabelSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })

  const updateLine = useCallback(() => {
    const sourceEl = document.querySelector(`[data-item-id="${relationship.sourceEntityId}"]`) as HTMLElement | null
    const targetEl = document.querySelector(`[data-item-id="${relationship.targetEntityId}"]`) as HTMLElement | null
    const containerEl = document.querySelector(".model-canvas") as HTMLElement | null

    if (!sourceEl || !targetEl || !containerEl) return

    const sourceRect = sourceEl.getBoundingClientRect()
    const targetRect = targetEl.getBoundingClientRect()
    const containerRect = containerEl.getBoundingClientRect()

    const sx = (sourceRect.left - containerRect.left) / zoom
    const sy = (sourceRect.top - containerRect.top) / zoom
    const sw = sourceRect.width / zoom
    const sh = sourceRect.height / zoom

    const tx = (targetRect.left - containerRect.left) / zoom
    const ty = (targetRect.top - containerRect.top) / zoom
    const tw = targetRect.width / zoom
    const th = targetRect.height / zoom

    const sourceCenterX = sx + sw / 2
    const sourceCenterY = sy + sh / 2
    const targetCenterX = tx + tw / 2
    const targetCenterY = ty + th / 2

    const dx = targetCenterX - sourceCenterX
    const dy = targetCenterY - sourceCenterY

    let x1: number, y1: number, x2: number, y2: number

    let sourceEdge: 'left' | 'right' | 'top' | 'bottom' = 'right'
    let targetEdge: 'left' | 'right' | 'top' | 'bottom' = 'left'

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        x1 = sx + sw
        y1 = sourceCenterY
        x2 = tx
        y2 = targetCenterY
        sourceEdge = 'right'
        targetEdge = 'left'
      } else {
        x1 = sx
        y1 = sourceCenterY
        x2 = tx + tw
        y2 = targetCenterY
        sourceEdge = 'left'
        targetEdge = 'right'
      }
    } else {
      if (dy > 0) {
        x1 = sourceCenterX
        y1 = sy + sh
        x2 = targetCenterX
        y2 = ty
        sourceEdge = 'bottom'
        targetEdge = 'top'
      } else {
        x1 = sourceCenterX
        y1 = sy
        x2 = targetCenterX
        y2 = ty + th
        sourceEdge = 'top'
        targetEdge = 'bottom'
      }
    }

    const centeredIndex = multiCount > 1 ? multiIndex - (multiCount - 1) / 2 : 0
    const anchorStep = 28
    const sMax = sourceEdge === 'left' || sourceEdge === 'right' ? Math.max(0, sh / 2 - 12) : Math.max(0, sw / 2 - 12)
    const tMax = targetEdge === 'left' || targetEdge === 'right' ? Math.max(0, th / 2 - 12) : Math.max(0, tw / 2 - 12)
    const sShift = Math.max(-sMax, Math.min(sMax, centeredIndex * anchorStep))
    const tShift = Math.max(-tMax, Math.min(tMax, centeredIndex * anchorStep))

    if (sourceEdge === 'left' || sourceEdge === 'right') {
      y1 += sShift
    } else {
      x1 += sShift
    }

    if (targetEdge === 'left' || targetEdge === 'right') {
      y2 += tShift
    } else {
      x2 += tShift
    }

    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2

    const sourceCardinalityX = x1 + (x2 - x1) * 0.15
    const sourceCardinalityY = y1 + (y2 - y1) * 0.15
    const targetCardinalityX = x1 + (x2 - x1) * 0.85
    const targetCardinalityY = y1 + (y2 - y1) * 0.85

    setLineCoords({
      x1,
      y1,
      x2,
      y2,
      midX,
      midY,
      sourceCardinalityX,
      sourceCardinalityY,
      targetCardinalityX,
      targetCardinalityY,
    })
  }, [relationship.sourceEntityId, relationship.targetEntityId, zoom, multiIndex, multiCount])

  useEffect(() => {
    const animate = () => {
      updateLine()
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [updateLine])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  // Measure label size to auto-fit background rect
  useEffect(() => {
    try {
      if (labelTextRef.current) {
        const box = labelTextRef.current.getBBox()
        if (box && (box.width !== labelSize.w || box.height !== labelSize.h)) {
          setLabelSize({ w: box.width, h: box.height })
        }
      }
    } catch {}
  }, [relationship.label, lineCoords, isEditing])

  if (!lineCoords) return null

  const { x1, y1, x2, y2, midX, midY, sourceCardinalityX, sourceCardinalityY, targetCardinalityX, targetCardinalityY } =
    lineCoords

  const sourceMin = relationship.minSource ?? 1
  const sourceMax = relationship.maxSource ?? (relationship.cardinality === "M:N" || relationship.cardinality === "1:N" ? "N" : 1)
  const targetMin = relationship.minTarget ?? 1
  const targetMax = relationship.maxTarget ?? (relationship.cardinality === "M:N" || relationship.cardinality === "1:N" ? "N" : 1)

  const handleSubmit = () => {
    const value = editValue.trim()
    if (value && value !== relationship.label) {
      onUpdateLabel?.(relationship.id, value)
    }
    setIsEditing(false)
  }

  const dx = x2 - x1
  const dy = y2 - y1
  const distance = Math.sqrt(dx * dx + dy * dy)
  const bezOffset = Math.min(distance * 0.4, 120)
  let cp1x = x1,
    cp1y = y1,
    cp2x = x2,
    cp2y = y2
  if (Math.abs(dx) > Math.abs(dy)) {
    cp1x = x1 + bezOffset * Math.sign(dx)
    cp1y = y1
    cp2x = x2 - bezOffset * Math.sign(dx)
    cp2y = y2
  } else {
    cp1x = x1
    cp1y = y1 + bezOffset * Math.sign(dy)
    cp2x = x2
    cp2y = y2 - bezOffset * Math.sign(dy)
  }

  const bundleSpread = Math.min(16 + distance * 0.05, 40)
  const centeredIndex = multiCount > 1 ? multiIndex - (multiCount - 1) / 2 : 0
  const norm = distance === 0 ? 0 : centeredIndex / multiCount
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const spreadAmount = bundleSpread * norm
  cp1x += nx * spreadAmount
  cp1y += ny * spreadAmount
  cp2x += nx * spreadAmount
  cp2y += ny * spreadAmount

  const pathD = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`

  // Definicje markerów strzałek
  const showArrowStart = relationship.direction === 'target-to-source'
  const showArrowEnd = relationship.direction === 'source-to-target'

  // Label cardinalities text
  const sLabel = `${sourceMin}..${sourceMax}`
  const tLabel = `${targetMin}..${targetMax}`

  // Offset prostopadły etykiet, jak wcześniej
  let sLabelX = x1
  let sLabelY = y1
  let tLabelX = x2
  let tLabelY = y2
  let sAnchor: 'start' | 'middle' | 'end' = 'middle'
  let tAnchor: 'start' | 'middle' | 'end' = 'middle'
  if (Math.abs(dx) > Math.abs(dy)) {
    const perpY = dy >= 0 ? -8 : 10
    if (dx > 0) {
      sLabelX = x1 + 8
      sLabelY = y1 + perpY
      sAnchor = 'start'
      tLabelX = x2 - 8
      tLabelY = y2 + perpY
      tAnchor = 'end'
    } else {
      sLabelX = x1 - 8
      sLabelY = y1 + perpY
      sAnchor = 'end'
      tLabelX = x2 + 8
      tLabelY = y2 + perpY
      tAnchor = 'start'
    }
  } else {
    const perpX = dx >= 0 ? 8 : -8
    if (dy > 0) {
      sLabelX = x1 + perpX
      sLabelY = y1 + 10
      sAnchor = 'middle'
      tLabelX = x2 + perpX
      tLabelY = y2 - 6
      tAnchor = 'middle'
    } else {
      sLabelX = x1 + perpX
      sLabelY = y1 - 6
      sAnchor = 'middle'
      tLabelX = x2 + perpX
      tLabelY = y2 + 10
      tAnchor = 'middle'
    }
  }

  return (
    <g>
      {/* Niewidoczna strefa trafień (większa) dla łatwiejszego hover/klik */}
      <path
        d={pathD}
        stroke="rgba(0,0,0,0.001)"
        strokeWidth={16}
        fill="none"
        style={{ pointerEvents: "stroke" }}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.()
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (selected) onRequestEdit?.(relationship.id)
        }}
      />

      <defs>
        {/* Black markers (default) */}
        <marker id={`arrow-end-black-${relationship.id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#000000" />
        </marker>
        <marker id={`arrow-start-black-${relationship.id}`} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M 8 0 L 0 4 L 8 8 z" fill="#000000" />
        </marker>
        {/* Blue markers (selected) */}
        <marker id={`arrow-end-blue-${relationship.id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#2563eb" />
        </marker>
        <marker id={`arrow-start-blue-${relationship.id}`} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M 8 0 L 0 4 L 8 8 z" fill="#2563eb" />
        </marker>
      </defs>

      <path
        d={pathD}
        stroke={selected || isHover ? "#2563eb" : "#6b7280"}
        strokeWidth={selected ? 3 : isHover ? 2.5 : 2}
        fill="none"
        className="pointer-events-none transition-[stroke,stroke-width] duration-150 ease-in-out"
        markerEnd={showArrowEnd ? `url(#arrow-end-${selected ? 'blue' : 'black'}-${relationship.id})` : undefined}
        markerStart={showArrowStart ? `url(#arrow-start-${selected ? 'blue' : 'black'}-${relationship.id})` : undefined}
      />

      {/* Cardinalities */}
      <text x={sLabelX} y={sLabelY} textAnchor={sAnchor} fontSize="10" fontWeight="700" fill="#374151" style={{ pointerEvents: 'none' }}>{sLabel}</text>
      <text x={tLabelX} y={tLabelY} textAnchor={tAnchor} fontSize="10" fontWeight="700" fill="#374151" style={{ pointerEvents: 'none' }}>{tLabel}</text>

      {relationship.label.trim() !== "" && (
        isEditing ? (
          <foreignObject x={midX - 80} y={midY - 14} width={160} height={28} style={{ pointerEvents: "all" }}>
            <div xmlns="http://www.w3.org/1999/xhtml">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit()
                  if (e.key === "Escape") setIsEditing(false)
                }}
                onBlur={handleSubmit}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white"
              />
            </div>
          </foreignObject>
        ) : (
          <g
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.()
            }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              setEditValue(relationship.label)
              setIsEditing(true)
            }}
            className="cursor-pointer"
            style={{ pointerEvents: "all" }}
          >
            {(() => {
              const padX = 8
              const padY = 4
              const rectW = Math.max(24, Math.ceil(labelSize.w) + padX * 2)
              const rectH = Math.max(16, Math.ceil(labelSize.h) + padY * 2)
              return (
                <>
                  <rect
                    x={midX - rectW / 2}
                    y={midY - rectH / 2}
                    width={rectW}
                    height={rectH}
                    fill="white"
                    stroke={selected ? "#2563eb" : "#6b7280"}
                    strokeWidth={selected ? 2 : 1}
                    rx={4}
                    className="hover:fill-gray-50"
                  />
                  <text
                    ref={labelTextRef}
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill="#374151"
                    className="select-none"
                  >
                    {relationship.label}
                  </text>
                </>
              )
            })()}
          </g>
        )
      )}
    </g>
  )
}
