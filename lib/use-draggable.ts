"use client"

import { useState, useRef, useCallback, useEffect } from 'react'

interface Position {
  x: number
  y: number
}

interface UseDraggableOptions {
  handleSelector?: string
}

export function useDraggable(options: UseDraggableOptions = {}) {
  const { handleSelector = '.dialog-drag-handle' } = options
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef<Position>({ x: 0, y: 0 })
  const elementStartPos = useRef<Position>({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement

    // Check if the click is on the drag handle or its children
    const isHandle = target.matches(handleSelector) || target.closest(handleSelector)

    if (isHandle) {
      setIsDragging(true)
      dragStartPos.current = { x: e.clientX, y: e.clientY }
      elementStartPos.current = position
      e.preventDefault()
      e.stopPropagation()
    }
  }, [position, handleSelector])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartPos.current.x
      const deltaY = e.clientY - dragStartPos.current.y
      setPosition({
        x: elementStartPos.current.x + deltaX,
        y: elementStartPos.current.y + deltaY,
      })
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return {
    position,
    isDragging,
    handleMouseDown,
    style: {
      transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
      cursor: isDragging ? 'grabbing' : undefined,
    },
  }
}
