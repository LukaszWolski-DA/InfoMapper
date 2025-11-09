"use client"

import { useEffect, useRef, useState, useCallback, memo, useMemo } from "react"
import type { Connection } from "@/lib/types"

// Throttle utility function to limit how often a function can be called
function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

interface ConnectionLineProps {
  connection: Connection
  onDelete: (connectionId: string) => void
  zoom?: number
  positionUpdateCounter?: number
  collapseCounter?: number
  filterUpdateCounter?: number
  editFormCounter?: number
  activeView?: string
}

export const ConnectionLine = memo(function ConnectionLine({ connection, onDelete, zoom = 1, positionUpdateCounter, collapseCounter, filterUpdateCounter, editFormCounter, activeView }: ConnectionLineProps) {
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

  // Visibility tracking for performance optimization
  const [isVisible, setIsVisible] = useState(true)

  // Element cache refs to reduce querySelector calls
  const sourceElRef = useRef<Element | null>(null)
  const targetElRef = useRef<Element | null>(null)
  const canvasElRef = useRef<HTMLElement | null>(null)

  const updatePosition = useCallback(() => {
    // Skip position calculation if not visible
    if (!isVisible) return

    let sourceEl: Element | null = sourceElRef.current
    let targetEl: Element | null = targetElRef.current
    let canvasEl: HTMLElement | null = canvasElRef.current
    let sourceIsCard = false
    let targetIsCard = false

    // Only query if cache miss or elements changed
    const needsRefresh = !sourceEl || !targetEl || !canvasEl

    // CRITICAL: Query canvas FIRST before source/target to scope element searches to visible canvas only
    if (needsRefresh || !canvasEl) {
      const allCanvases = document.querySelectorAll(".mapping-canvas")
      canvasEl = Array.from(allCanvases).find(el => {
        const style = window.getComputedStyle(el as HTMLElement)
        return style.display !== 'none'
      }) as HTMLElement | null || null
      canvasElRef.current = canvasEl
    }

    if (!canvasEl) return

    // Try to find source element (scoped to visible canvas)
    if (needsRefresh || !sourceEl) {
      if (connection.source.attrId) {
        // First try to find the attribute within visible canvas
        sourceEl = canvasEl.querySelector(`[data-attr-id="${connection.source.attrId}"]`)

        if (!sourceEl) {
          sourceEl = canvasEl.querySelector(`[data-item-id="${connection.source.itemId}"]`)
          sourceIsCard = true
        }
      } else {
        // Entity/requirement level connection
        sourceEl = canvasEl.querySelector(`[data-item-id="${connection.source.itemId}"]`)
        sourceIsCard = true
      }
      sourceElRef.current = sourceEl
    }

    // Try to find target element (scoped to visible canvas)
    if (needsRefresh || !targetEl) {
      if (connection.target.attrId) {
        // First try to find the attribute within visible canvas
        targetEl = canvasEl.querySelector(`[data-attr-id="${connection.target.attrId}"]`)

        if (!targetEl) {
          targetEl = canvasEl.querySelector(`[data-item-id="${connection.target.itemId}"]`)
          targetIsCard = true
        }
      } else {
        // Entity/requirement level connection
        targetEl = canvasEl.querySelector(`[data-item-id="${connection.target.itemId}"]`)
        targetIsCard = true
      }
      targetElRef.current = targetEl
    }

    if (!sourceEl || !targetEl) return

    const sourceRect = sourceEl.getBoundingClientRect()
    const targetRect = targetEl.getBoundingClientRect()
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
  }, [connection.source.attrId, connection.source.itemId, connection.target.attrId, connection.target.itemId, zoom, isVisible, positionUpdateCounter])

  // Reset cache when connection endpoints change, cards collapse/expand, filters change, edit forms open/close, or view changes
  useEffect(() => {
    sourceElRef.current = null
    targetElRef.current = null
  }, [connection.source.itemId, connection.target.itemId, collapseCounter, filterUpdateCounter, editFormCounter, activeView])

  // Reset canvas cache when activeView changes to prevent stale coordinates
  useEffect(() => {
    canvasElRef.current = null
  }, [activeView])

  // Throttled version - max 60fps (16ms)
  const throttledUpdate = useMemo(
    () => throttle(() => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      animationFrameRef.current = requestAnimationFrame(updatePosition)
    }, 16), // 16ms = ~60fps
    [updatePosition]
  )

  // Intersection Observer - only update visible connections
  useEffect(() => {
    if (!lineRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          setIsVisible(entry.isIntersecting)
        })
      },
      {
        // Trigger when connection is within viewport + 100px margin
        rootMargin: '100px',
        threshold: 0
      }
    )

    observer.observe(lineRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  // Immediate position update on mount to fix initial render
  useEffect(() => {
    // Use setTimeout to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      updatePosition()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [updatePosition])

  useEffect(() => {
    // Only update if visible
    if (isVisible) {
      throttledUpdate()
    }

    const diagramEl = document.querySelector(".mapping-scroll-container")
    if (diagramEl) {
      diagramEl.addEventListener("scroll", throttledUpdate)
    }
    window.addEventListener("resize", throttledUpdate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (diagramEl) {
        diagramEl.removeEventListener("scroll", throttledUpdate)
      }
      window.removeEventListener("resize", throttledUpdate)
    }
  }, [throttledUpdate, isVisible])

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
      style={{ left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`, zIndex: 50 }}
    >
      <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
        <defs>
          {/* Normal state arrowhead */}
          <marker id={`arrowhead-${connection.id}`} markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColorSolid} opacity="0.7" />
          </marker>
          {/* Hovered state arrowhead */}
          <marker id={`arrowhead-hover-${connection.id}`} markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColorSolid} opacity="1" />
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
          markerEnd={isHovered ? `url(#arrowhead-hover-${connection.id})` : `url(#arrowhead-${connection.id})`}
          filter={`url(#shadow-${connection.id})`}
          style={{ transition: "stroke-width 0.2s ease, stroke 0.2s ease", strokeWidth: isHovered ? "2.5" : "1.5", stroke: isHovered ? strokeColorSolid : strokeColor, pointerEvents: "none" }}
        />
      </svg>

      {isHovered && (
        <button
          className="absolute bg-white text-gray-400 border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-300 pointer-events-auto transition-all duration-200 shadow-sm"
          style={{ left: `${midX - left - 12}px`, top: `${midY - top - 12}px` }}
          onClick={() => onDelete(connection.id)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title="Delete connection"
        >
          ×
        </button>
      )}
    </div>
  )
})
// Note: Custom comparison removed to allow re-renders when cards move
// Default shallow comparison will detect when connection object reference changes
