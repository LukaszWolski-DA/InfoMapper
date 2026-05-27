import dagre from 'dagre'
import type { LogicalEntity, LogicalAttribute, Relationship, DiagramItem } from '../types'

interface Position {
  x: number
  y: number
}

interface EntityBox {
  entity: LogicalEntity
  attributes: LogicalAttribute[]
  x: number
  y: number
  width: number
  height: number
}

const ENTITY_WIDTH = 220
const ENTITY_HEADER_HEIGHT = 40
const ATTRIBUTE_HEIGHT = 20
const PADDING = 10
const MIN_HEIGHT = 100

// Stereotype colors (matching Model view)
const STEREOTYPE_COLORS: Record<string, { light: string; dark: string }> = {
  'Object': { light: '#E3F2FD', dark: '#1976D2' },
  'Link': { light: '#E0F2F1', dark: '#00796B' },
  'Dictionary': { light: '#FFF3E0', dark: '#F57C00' },
  'Context': { light: '#F3E5F5', dark: '#7B1FA2' },
  'Informative': { light: '#E8EAF6', dark: '#3F51B5' },
}

export function generateERDSvg(
  entities: LogicalEntity[],
  attributes: LogicalAttribute[],
  relationships: Relationship[],
  modelItems?: DiagramItem[]
): string {
  if (entities.length === 0) {
    return '<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><text x="200" y="100" text-anchor="middle" fill="#999">No entities selected</text></svg>'
  }

  // Get entity positions
  const positions = getEntityPositions(entities, relationships, modelItems)

  // Build entity boxes with calculated heights
  const boxes: EntityBox[] = entities.map(entity => {
    const entityAttrs = attributes.filter(a => a.entityId === entity.id)
    const displayedAttrs = entityAttrs.slice(0, 5) // Show first 5 attributes

    const height = Math.max(
      MIN_HEIGHT,
      ENTITY_HEADER_HEIGHT + (displayedAttrs.length * ATTRIBUTE_HEIGHT) + PADDING * 2
    )

    const pos = positions.get(entity.id) || { x: 0, y: 0 }

    return {
      entity,
      attributes: displayedAttrs,
      x: pos.x,
      y: pos.y,
      width: ENTITY_WIDTH,
      height,
    }
  })

  // Calculate canvas size
  const canvasSize = calculateCanvasSize(boxes)

  // Generate SVG
  const svg: string[] = []
  svg.push(`<svg width="${canvasSize.width}" height="${canvasSize.height}" xmlns="http://www.w3.org/2000/svg">`)

  // Render relationships first (so they appear behind entities)
  const entityIds = new Set(entities.map(e => e.id))
  const relevantRelationships = relationships.filter(
    r => entityIds.has(r.sourceEntityId) && entityIds.has(r.targetEntityId)
  )

  relevantRelationships.forEach(rel => {
    const sourceBox = boxes.find(b => b.entity.id === rel.sourceEntityId)
    const targetBox = boxes.find(b => b.entity.id === rel.targetEntityId)
    if (sourceBox && targetBox) {
      svg.push(renderRelationship(sourceBox, targetBox, rel))
    }
  })

  // Render entities
  boxes.forEach(box => {
    svg.push(renderEntity(box))
  })

  svg.push('</svg>')

  return svg.join('\n')
}

function getEntityPositions(
  entities: LogicalEntity[],
  relationships: Relationship[],
  modelItems?: DiagramItem[]
): Map<string, Position> {
  const positions = new Map<string, Position>()

  // Try to use Model view positions first
  if (modelItems && modelItems.length > 0) {
    let hasAllPositions = true
    entities.forEach(entity => {
      const item = modelItems.find(i => i.itemId === entity.id)
      if (item) {
        positions.set(entity.id, { x: item.left, y: item.top })
      } else {
        hasAllPositions = false
      }
    })

    if (hasAllPositions) {
      return positions
    }
  }

  // Fallback: use dagre auto-layout
  return autoLayoutWithDagre(entities, relationships)
}

function autoLayoutWithDagre(
  entities: LogicalEntity[],
  relationships: Relationship[]
): Map<string, Position> {
  const g = new dagre.graphlib.Graph()

  // Configure layout
  g.setGraph({
    rankdir: 'TB', // Top to bottom
    nodesep: 80,   // Horizontal spacing between nodes
    ranksep: 100,  // Vertical spacing between ranks
    marginx: 40,
    marginy: 40,
  })

  g.setDefaultEdgeLabel(() => ({}))

  // Add nodes
  entities.forEach(entity => {
    g.setNode(entity.id, {
      label: entity.name,
      width: ENTITY_WIDTH,
      height: MIN_HEIGHT,
    })
  })

  // Add edges
  const entityIds = new Set(entities.map(e => e.id))
  relationships.forEach(rel => {
    if (entityIds.has(rel.sourceEntityId) && entityIds.has(rel.targetEntityId)) {
      g.setEdge(rel.sourceEntityId, rel.targetEntityId)
    }
  })

  // Run layout
  dagre.layout(g)

  // Extract positions
  const positions = new Map<string, Position>()
  g.nodes().forEach(nodeId => {
    const node = g.node(nodeId)
    positions.set(nodeId, {
      x: node.x,
      y: node.y,
    })
  })

  return positions
}

function calculateCanvasSize(boxes: EntityBox[]): { width: number; height: number } {
  if (boxes.length === 0) {
    return { width: 400, height: 200 }
  }

  let maxX = 0
  let maxY = 0

  boxes.forEach(box => {
    maxX = Math.max(maxX, box.x + box.width / 2)
    maxY = Math.max(maxY, box.y + box.height / 2)
  })

  return {
    width: Math.max(600, maxX + 100),
    height: Math.max(400, maxY + 100),
  }
}

function renderEntity(box: EntityBox): string {
  const { entity, attributes, x, y, width, height } = box

  const stereotype = entity.stereotype || 'Object'
  const colors = STEREOTYPE_COLORS[stereotype] || STEREOTYPE_COLORS['Object']

  const svg: string[] = []

  // Calculate top-left corner
  const left = x - width / 2
  const top = y - height / 2

  // Outer rectangle
  svg.push(`  <rect x="${left}" y="${top}" width="${width}" height="${height}" fill="${colors.light}" stroke="${colors.dark}" stroke-width="2" rx="4" />`)

  // Header background
  svg.push(`  <rect x="${left}" y="${top}" width="${width}" height="${ENTITY_HEADER_HEIGHT}" fill="${colors.dark}" rx="4" />`)
  svg.push(`  <rect x="${left}" y="${top + ENTITY_HEADER_HEIGHT - 4}" width="${width}" height="4" fill="${colors.dark}" />`)

  // Entity name
  svg.push(`  <text x="${x}" y="${top + 16}" text-anchor="middle" font-weight="bold" font-size="14" fill="white">${escapeXml(entity.name)}</text>`)

  // Stereotype
  svg.push(`  <text x="${x}" y="${top + 32}" text-anchor="middle" font-size="11" fill="white" opacity="0.9">${escapeXml(stereotype)}</text>`)

  // Attributes
  let attrY = top + ENTITY_HEADER_HEIGHT + PADDING + 14
  attributes.forEach(attr => {
    const icon = attr.isPrimaryKey ? '🔑 ' :
                 attr.isForeignKey ? '🔗 ' :
                 attr.isPII ? '🔒 ' : '• '

    svg.push(`  <text x="${left + PADDING}" y="${attrY}" font-size="11" fill="#333">${icon}${escapeXml(attr.name)}</text>`)

    // Data type (right-aligned)
    if (attr.dataType) {
      svg.push(`  <text x="${left + width - PADDING}" y="${attrY}" text-anchor="end" font-size="10" fill="#666">${escapeXml(attr.dataType)}</text>`)
    }

    attrY += ATTRIBUTE_HEIGHT
  })

  // "..." indicator if more attributes exist
  if (box.entity.id) {
    const totalAttrs = attributes.length
    // This is a simplification - in real implementation, you'd count total attributes
    if (totalAttrs >= 5) {
      svg.push(`  <text x="${left + PADDING}" y="${attrY}" font-size="11" fill="#999" font-style="italic">...</text>`)
    }
  }

  return svg.join('\n')
}

function renderRelationship(
  sourceBox: EntityBox,
  targetBox: EntityBox,
  relationship: Relationship
): string {
  const svg: string[] = []

  // Simple straight line (enhancement: use bezier curves for better routing)
  const x1 = sourceBox.x
  const y1 = sourceBox.y + sourceBox.height / 2
  const x2 = targetBox.x
  const y2 = targetBox.y - targetBox.height / 2

  // Line
  svg.push(`  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#666" stroke-width="2" opacity="0.6" />`)

  // Label
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  const label = relationship.label || relationship.cardinality

  svg.push(`  <text x="${midX}" y="${midY - 5}" text-anchor="middle" font-size="11" fill="#666">${escapeXml(label)}</text>`)

  // Arrow at target
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const arrowSize = 10
  const arrowX = x2 - Math.cos(angle) * 20
  const arrowY = y2 - Math.sin(angle) * 20

  const arrowPoints = [
    { x: arrowX, y: arrowY },
    { x: arrowX - Math.cos(angle - Math.PI / 6) * arrowSize, y: arrowY - Math.sin(angle - Math.PI / 6) * arrowSize },
    { x: arrowX - Math.cos(angle + Math.PI / 6) * arrowSize, y: arrowY - Math.sin(angle + Math.PI / 6) * arrowSize },
  ]

  const pointsStr = arrowPoints.map(p => `${p.x},${p.y}`).join(' ')
  svg.push(`  <polygon points="${pointsStr}" fill="#666" opacity="0.6" />`)

  return svg.join('\n')
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
