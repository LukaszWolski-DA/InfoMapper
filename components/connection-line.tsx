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
  diagramItems?: import("@/lib/types").DiagramItem[]
  positionUpdateCounter?: number
  collapseCounter?: number
  filterUpdateCounter?: number
  editFormCounter?: number
  activeView?: string
}

export const ConnectionLine = memo(function ConnectionLine({ connection, onDelete, zoom = 1, diagramItems, positionUpdateCounter, collapseCounter, filterUpdateCounter, editFormCounter, activeView }: ConnectionLineProps) {
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

  const updatePosition = useCallback(() => {
    // Skip position calculation if not visible
    if (!isVisible) return

    // ============================
    // HYBRID POSITIONING APPROACH
    // Prefer handles from state, but fallback to card-level positioning
    // ============================
    let sourceItem: import("@/lib/types").DiagramItem | undefined
    let targetItem: import("@/lib/types").DiagramItem | undefined

    if (diagramItems) {
      sourceItem = diagramItems.find((item) => item.itemId === connection.source.itemId)
      targetItem = diagramItems.find((item) => item.itemId === connection.target.itemId)
    }

    // Validate that both items exist
    if (!sourceItem || !targetItem) {
      // Items don't exist - don't render the line (return without setting position)
      return
    }

    // Check if either card is collapsed
    const isSourceCollapsed = sourceItem.collapsed
    const isTargetCollapsed = targetItem.collapsed

    // Check if specific connection attributes have handles (are visible)
    const sourceAttrHasHandle = connection.source.attrId
      ? sourceItem.handles?.some(h => h.attrId === connection.source.attrId)
      : false
    const targetAttrHasHandle = connection.target.attrId
      ? targetItem.handles?.some(h => h.attrId === connection.target.attrId)
      : false

    // CASE 1: BOTH cards collapsed OR both connection attributes missing - connect edge centers
    if ((isSourceCollapsed || !sourceAttrHasHandle) && (isTargetCollapsed || !targetAttrHasHandle)) {
      const sourceWidth = sourceItem.width || 200
      const targetWidth = targetItem.width || 200
      const sourceHeight = sourceItem.height || 100
      const targetHeight = targetItem.height || 100

      // Calculate relative positions to determine which edges to connect
      const dx = targetItem.left - sourceItem.left
      const dy = targetItem.top - sourceItem.top

      let startX, startY, endX, endY

      // Determine layout orientation and calculate edge center positions
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal layout - connect left/right edges at vertical center
        if (dx > 0) {
          // Target is to the right of source
          startX = sourceItem.left + sourceWidth // Right edge of source
          startY = sourceItem.top + (sourceHeight / 2) // Vertical center
          endX = targetItem.left // Left edge of target
          endY = targetItem.top + (targetHeight / 2)
        } else {
          // Target is to the left of source
          startX = sourceItem.left // Left edge of source
          startY = sourceItem.top + (sourceHeight / 2)
          endX = targetItem.left + targetWidth // Right edge of target
          endY = targetItem.top + (targetHeight / 2)
        }
      } else {
        // Vertical layout - connect top/bottom edges at horizontal center
        if (dy > 0) {
          // Target is below source
          startX = sourceItem.left + (sourceWidth / 2) // Horizontal center
          startY = sourceItem.top + sourceHeight // Bottom edge
          endX = targetItem.left + (targetWidth / 2)
          endY = targetItem.top // Top edge
        } else {
          // Target is above source
          startX = sourceItem.left + (sourceWidth / 2)
          startY = sourceItem.top // Top edge
          endX = targetItem.left + (targetWidth / 2)
          endY = targetItem.top + targetHeight // Bottom edge
        }
      }

      const angle = Math.atan2(endY - startY, endX - startX)
      setPosition({ startX, startY, endX, endY, angle })
      return
    }

    // CASE 2: SOURCE collapsed/missing BUT TARGET has handle - connect source edge center to target attribute handle
    if ((isSourceCollapsed || !sourceAttrHasHandle) && targetAttrHasHandle && connection.target.attrId) {
      const sourceWidth = sourceItem.width || 200
      const sourceHeight = sourceItem.height || 100

      // Calculate source edge center based on target position
      const dx = targetItem.left - sourceItem.left
      const dy = targetItem.top - sourceItem.top

      let startX, startY
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal: use right or left edge center
        startX = dx > 0 ? sourceItem.left + sourceWidth : sourceItem.left
        startY = sourceItem.top + (sourceHeight / 2)
      } else {
        // Vertical: use bottom or top edge center
        startX = sourceItem.left + (sourceWidth / 2)
        startY = dy > 0 ? sourceItem.top + sourceHeight : sourceItem.top
      }

      // Find best target handle (use existing handle logic)
      const targetHandles = targetItem.handles?.filter((h) => h.attrId === connection.target.attrId) || []
      if (targetHandles.length > 0) {
        // Find closest handle to source edge center
        let minDistance = Infinity
        let bestTarget: import("@/lib/types").HandlePosition | undefined

        for (const th of targetHandles) {
          const distance = Math.sqrt(Math.pow(th.x - startX, 2) + Math.pow(th.y - startY, 2))
          if (distance < minDistance) {
            minDistance = distance
            bestTarget = th
          }
        }

        if (bestTarget) {
          const angle = Math.atan2(bestTarget.y - startY, bestTarget.x - startX)
          setPosition({ startX, startY, endX: bestTarget.x, endY: bestTarget.y, angle })
          return
        }
      } else {
        // FALLBACK: Target attribute handle not found (filtered out) - use target edge center too
        const targetWidth = targetItem.width || 200
        const targetHeight = targetItem.height || 100

        let endX, endY
        if (Math.abs(dx) > Math.abs(dy)) {
          endX = dx > 0 ? targetItem.left : targetItem.left + targetWidth
          endY = targetItem.top + (targetHeight / 2)
        } else {
          endX = targetItem.left + (targetWidth / 2)
          endY = dy > 0 ? targetItem.top : targetItem.top + targetHeight
        }

        const angle = Math.atan2(endY - startY, endX - startX)
        setPosition({ startX, startY, endX, endY, angle })
        return
      }
    }

    // CASE 3: TARGET collapsed/missing BUT SOURCE has handle - connect source attribute handle to target edge center
    if (sourceAttrHasHandle && (isTargetCollapsed || !targetAttrHasHandle) && connection.source.attrId) {
      const targetWidth = targetItem.width || 200
      const targetHeight = targetItem.height || 100

      // Calculate target edge center based on source position
      const dx = targetItem.left - sourceItem.left
      const dy = targetItem.top - sourceItem.top

      let endX, endY
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal: use left or right edge center
        endX = dx > 0 ? targetItem.left : targetItem.left + targetWidth
        endY = targetItem.top + (targetHeight / 2)
      } else {
        // Vertical: use top or bottom edge center
        endX = targetItem.left + (targetWidth / 2)
        endY = dy > 0 ? targetItem.top : targetItem.top + targetHeight
      }

      // Find best source handle (use existing handle logic)
      const sourceHandles = sourceItem.handles?.filter((h) => h.attrId === connection.source.attrId) || []
      if (sourceHandles.length > 0) {
        // Find closest handle to target edge center
        let minDistance = Infinity
        let bestSource: import("@/lib/types").HandlePosition | undefined

        for (const sh of sourceHandles) {
          const distance = Math.sqrt(Math.pow(endX - sh.x, 2) + Math.pow(endY - sh.y, 2))
          if (distance < minDistance) {
            minDistance = distance
            bestSource = sh
          }
        }

        if (bestSource) {
          const angle = Math.atan2(endY - bestSource.y, endX - bestSource.x)
          setPosition({ startX: bestSource.x, startY: bestSource.y, endX, endY, angle })
          return
        }
      } else {
        // FALLBACK: Source attribute handle not found (filtered out) - use source edge center too
        const sourceWidth = sourceItem.width || 200
        const sourceHeight = sourceItem.height || 100

        let startX, startY
        if (Math.abs(dx) > Math.abs(dy)) {
          startX = dx > 0 ? sourceItem.left + sourceWidth : sourceItem.left
          startY = sourceItem.top + (sourceHeight / 2)
        } else {
          startX = sourceItem.left + (sourceWidth / 2)
          startY = dy > 0 ? sourceItem.top + sourceHeight : sourceItem.top
        }

        const angle = Math.atan2(endY - startY, endX - startX)
        setPosition({ startX, startY, endX, endY, angle })
        return
      }
    }

    // For attribute-level connections, try to use handles from state
    if (connection.source.attrId && connection.target.attrId) {
      // Check if we have handles for both source and target
      const sourceHandles = sourceItem.handles?.filter((h) => h.attrId === connection.source.attrId) || []
      const targetHandles = targetItem.handles?.filter((h) => h.attrId === connection.target.attrId) || []

      // If we have handles, use them
      if (sourceHandles.length > 0 && targetHandles.length > 0) {
        // Find the shortest connection by calculating distance for all combinations
        let minDistance = Infinity
        let bestSource: import("@/lib/types").HandlePosition | undefined
        let bestTarget: import("@/lib/types").HandlePosition | undefined

        for (const sh of sourceHandles) {
          for (const th of targetHandles) {
            const distance = Math.sqrt(Math.pow(th.x - sh.x, 2) + Math.pow(th.y - sh.y, 2))
            if (distance < minDistance) {
              minDistance = distance
              bestSource = sh
              bestTarget = th
            }
          }
        }

        if (bestSource && bestTarget) {
          // Use the best handles to position the line
          const startX = bestSource.x
          const startY = bestSource.y
          const endX = bestTarget.x
          const endY = bestTarget.y
          const angle = Math.atan2(endY - startY, endX - startX)

          setPosition({ startX, startY, endX, endY, angle })
          return
        }
      }

      // FALLBACK: If handles not available, use card-level approximation
      // This ensures arrows still render even if handles aren't calculated yet
      const sourceWidth = sourceItem.width || 200
      const targetWidth = targetItem.width || 200
      const approximateHeaderHeight = 140
      const approximateRowHeight = 41

      // Approximate Y position based on card structure
      // Note: This is less accurate but ensures visibility
      const sourceY = sourceItem.top + approximateHeaderHeight + 20
      const targetY = targetItem.top + approximateHeaderHeight + 20

      // Connect from right edge of source to left edge of target (typical layout)
      // TRUE SYMMETRIC: both sides with equal padding offset
      const cardPadding = 16
      const startX = sourceItem.left + sourceWidth - cardPadding // Right edge - padding
      const startY = sourceY
      const endX = targetItem.left + cardPadding // Left edge + padding
      const endY = targetY
      const angle = Math.atan2(endY - startY, endX - startX)

      setPosition({ startX, startY, endX, endY, angle })
      return
    }

    // For entity-level connections (no attrId), connect card centers
    // This is a simple fallback for requirement-to-entity connections
    const sourceX = sourceItem.left + (sourceItem.width || 200) / 2
    const sourceY = sourceItem.top + (sourceItem.height || 100) / 2
    const targetX = targetItem.left + (targetItem.width || 200) / 2
    const targetY = targetItem.top + (targetItem.height || 100) / 2
    const angle = Math.atan2(targetY - sourceY, targetX - sourceX)

    setPosition({
      startX: sourceX,
      startY: sourceY,
      endX: targetX,
      endY: targetY,
      angle
    })
  }, [connection.source.attrId, connection.source.itemId, connection.target.attrId, connection.target.itemId, isVisible, diagramItems])

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
