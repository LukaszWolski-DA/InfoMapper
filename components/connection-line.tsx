"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { Connection } from "@/lib/types"

interface ConnectionLineProps {
  connection: Connection
  onDelete: (connectionId: string) => void
  zoom?: number
}

export function ConnectionLine({ connection, onDelete, zoom = 1 }: ConnectionLineProps) {
  const lineRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    angle: 0,
  })
  const [isHovered, setIsHovered] = useState(false)
  const animationFrameRef = useRef<number | undefined>(undefined)

  const updatePosition = useCallback(() => {
    let sourceEl: Element | null = null
    let targetEl: Element | null = null
    let sourceIsCard = false
    let targetIsCard = false

    // Try to find source element
    if (connection.source.attrId) {
      // First try to find the attribute
      sourceEl = document.querySelector(`[data-attr-id="${connection.source.attrId}"]`)

      if (!sourceEl) {
        sourceEl = document.querySelector(`[data-item-id="${connection.source.itemId}"]`)
        sourceIsCard = true
      }
    } else {
      // Entity/requirement level connection
      sourceEl = document.querySelector(`[data-item-id="${connection.source.itemId}"]`)
      sourceIsCard = true
    }

    // Try to find target element
    if (connection.target.attrId) {
      // First try to find the attribute
      targetEl = document.querySelector(`[data-attr-id="${connection.target.attrId}"]`)

      if (!targetEl) {
        targetEl = document.querySelector(`[data-item-id="${connection.target.itemId}"]`)
        targetIsCard = true
      }
    } else {
      // Entity/requirement level connection
      targetEl = document.querySelector(`[data-item-id="${connection.target.itemId}"]`)
      targetIsCard = true
    }

    if (!sourceEl || !targetEl) return

    const sourceRect = sourceEl.getBoundingClientRect()
    const targetRect = targetEl.getBoundingClientRect()
    const canvasEl = document.querySelector(".mapping-canvas") as HTMLElement | null
    if (!canvasEl) return
    const canvasRect = canvasEl.getBoundingClientRect()

    // Convert to unscaled canvas coordinates (divide by zoom)
    let sx = (sourceRect.left - canvasRect.left) / zoom
    let sy = (sourceRect.top - canvasRect.top) / zoom
    let sw = sourceRect.width / zoom
    let sh = sourceRect.height / zoom

    let tx = (targetRect.left - canvasRect.left) / zoom
    let ty = (targetRect.top - canvasRect.top) / zoom
    let tw = targetRect.width / zoom
    let th = targetRect.height / zoom

    let sourceCenterY = sy + sh / 2
    let targetCenterY = ty + th / 2

    // If source is a card (entity-level), try to find entity name element
    if (sourceIsCard) {
      const sourceNameEl = (sourceEl as HTMLElement).querySelector('[data-entity-name="true"]') as HTMLElement | null
      if (sourceNameEl) {
        const nameRect = sourceNameEl.getBoundingClientRect()
        const ny = (nameRect.top - canvasRect.top) / zoom
        const nh = nameRect.height / zoom
        sourceCenterY = ny + nh / 2
      }
    }

    // If target is a card (entity-level), try to find entity name element
    if (targetIsCard) {
      const targetNameEl = (targetEl as HTMLElement).querySelector('[data-entity-name="true"]') as HTMLElement | null
      if (targetNameEl) {
        const nameRect = targetNameEl.getBoundingClientRect()
        const ny = (nameRect.top - canvasRect.top) / zoom
        const nh = nameRect.height / zoom
        targetCenterY = ny + nh / 2
      }
    }

    const sourceCenterX = sx + sw / 2
    const targetCenterX = tx + tw / 2

    // Calculate relative position
    const dx = targetCenterX - sourceCenterX
    const dy = targetCenterY - sourceCenterY

    let startX, startY, endX, endY

    const isAttributeConnection = connection.source.attrId && connection.target.attrId && !sourceIsCard && !targetIsCard

    if (isAttributeConnection) {
      // For attribute connections, always anchor to left/right edges
      if (dx > 0) {
        // Target is to the right - connect from right edge to left edge
        startX = sx + sw
        startY = sourceCenterY
        endX = tx
        endY = targetCenterY
      } else {
        // Target is to the left - connect from left edge to right edge
        startX = sx
        startY = sourceCenterY
        endX = tx + tw
        endY = targetCenterY
      }
    } else {
      // For card-to-card connections (or when attribute is hidden), use smart edge detection
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal connection is dominant
        if (dx > 0) {
          // Target is to the right
          startX = sx + sw
          startY = sourceCenterY
          endX = tx
          endY = targetCenterY
        } else {
          // Target is to the left
          startX = sx
          startY = sourceCenterY
          endX = tx + tw
          endY = targetCenterY
        }
      } else {
        // Vertical connection is dominant
        if (dy > 0) {
          // Target is below
          startX = sourceCenterX
          startY = sy + sh
          endX = targetCenterX
          endY = ty
        } else {
          // Target is above
          startX = sourceCenterX
          startY = sy
          endX = targetCenterX
          endY = ty + th
        }
      }
    }

    const angle = Math.atan2(endY - startY, endX - startX)

    setPosition({ startX, startY, endX, endY, angle })
  }, [connection.source.attrId, connection.source.itemId, connection.target.attrId, connection.target.itemId, zoom])

  useEffect(() => {
    updatePosition()

    const animate = () => {
      updatePosition()
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    animationFrameRef.current = requestAnimationFrame(animate)

    const diagramEl = document.querySelector(".mapping-scroll-container")
    if (diagramEl) {
      diagramEl.addEventListener("scroll", updatePosition)
    }
    window.addEventListener("resize", updatePosition)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (diagramEl) {
        diagramEl.removeEventListener("scroll", updatePosition)
      }
      window.removeEventListener("resize", updatePosition)
    }
  }, [updatePosition])

  const { startX, startY, endX, endY, angle } = position

  const left = Math.min(startX, endX) - 20
  const top = Math.min(startY, endY) - 20
  const width = Math.abs(endX - startX) + 40
  const height = Math.abs(endY - startY) + 40

  const relStartX = startX - left
  const relStartY = startY - top
  const relEndX = endX - left
  const relEndY = endY - top

  const dx = endX - startX
  const dy = endY - startY
  const distance = Math.sqrt(dx * dx + dy * dy)
  const controlPointOffset = Math.min(distance * 0.4, 100)

  let cp1x, cp1y, cp2x, cp2y

  if (Math.abs(dx) > Math.abs(dy)) {
    cp1x = relStartX + controlPointOffset * Math.sign(dx)
    cp1y = relStartY
    cp2x = relEndX - controlPointOffset * Math.sign(dx)
    cp2y = relEndY
  } else {
    cp1x = relStartX
    cp1y = relStartY + controlPointOffset * Math.sign(dy)
    cp2x = relEndX
    cp2y = relEndY - controlPointOffset * Math.sign(dy)
  }

  const pathD = `M ${relStartX} ${relStartY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${relEndX} ${relEndY}`

  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2

  const strokeColor =
    connection.type === "requirement-mapping"
      ? "rgba(147, 51, 234, 0.6)"
      : "rgba(37, 99, 235, 0.5)"

  const strokeColorSolid = connection.type === "requirement-mapping" ? "#9333ea" : "#2563eb"

  return (
    <div
      ref={lineRef}
      className="absolute pointer-events-none"
      style={{ left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`, zIndex: 10 }}
    >
      <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-auto">
        <defs>
          <marker id={`arrowhead-${connection.id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M 0 0 L 8 4 L 0 8 z" fill={strokeColorSolid} opacity="0.7" />
          </marker>
          <filter id={`shadow-${connection.id}`}>
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Niewidoczna strefa trafień wzdłuż linii – poprawia hover/klik dokładnie po śladzie */}
        <path
          d={pathD}
          stroke="rgba(0,0,0,0.001)"
          strokeWidth={16}
          fill="none"
          style={{ pointerEvents: "stroke" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />

        <path
          d={pathD}
          stroke={strokeColor}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          markerEnd={`url(#arrowhead-${connection.id})`}
          filter={`url(#shadow-${connection.id})`}
          style={{ transition: "stroke-width 0.2s ease, stroke 0.2s ease", strokeWidth: isHovered ? "2.5" : "1.5", stroke: isHovered ? strokeColorSolid : strokeColor }}
        />
      </svg>

      {isHovered && (
        <button
          className="absolute bg-white text-gray-400 border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-300 pointer-events-auto transition-all duration-200 shadow-sm"
          style={{ left: `${midX - left - 12}px`, top: `${midY - top - 12}px` }}
          onClick={() => onDelete(connection.id)}
          title="Delete connection"
        >
          ×
        </button>
      )}
    </div>
  )
}
