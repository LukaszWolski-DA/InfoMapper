export interface Entity {
  id: string
  name: string
  nameEn: string
  stereotype: string
  status: string
  attributes: Attribute[]
}

export interface Source {
  id: string
  database: string
  schema: string
  table: string
  isGoldenSource: boolean
  attributes: Attribute[]
}

export interface Requirement {
  id: string
  name: string
  description: string
  priority: string
  status: string
}

export interface Attribute {
  id: string
  name: string
  nameEn?: string
  stereotype: string
  isPrimaryKey?: boolean
  isForeignKey?: boolean
  isPII?: boolean // Added PII flag for data governance
  dataType?: string
  tags?: string[] // Source column tags (for imported sources only)
}

export interface HandlePosition {
  attrId: string // Attribute ID this handle corresponds to
  side: 'left' | 'right' // Which side of the card this handle is on
  x: number // Absolute X position on diagram
  y: number // Absolute Y position on diagram
}

export interface DiagramItem {
  itemId: string
  itemType: "entity" | "source" | "requirement"
  left: number
  top: number
  hidden: boolean
  collapsed: boolean
  objectType?: string
  attributeFilter?: "all" | "mapped" | "unmapped" | "keys"
  width?: number // Added custom width property for resizable cards
  height?: number // Card height calculated from content
  handles?: HandlePosition[] // Connection handle positions for each attribute
  showOnlyMapped?: boolean // UI hint used in Mapping filters
  // Usunięto: customAttributes, attributeOverrides, hiddenAttributes
  // Atrybuty są teraz przechowywane tylko w LogicalAttribute[] w store
}

export interface Connection {
  id: string
  type: "attribute-mapping" | "requirement-mapping"
  source: {
    attrId: string // Empty string for entity-level connections
    attrName: string
    parentId: string
    parentType: string
    itemId: string
  }
  target: {
    attrId: string // Empty string for entity-level connections
    attrName: string
    parentId: string
    parentType: string
    itemId: string
  }
}

export interface Relationship {
  id: string
  sourceEntityId: string
  targetEntityId: string
  label: string
  cardinality: "1:1" | "1:N" | "M:N"
  // Rozszerzenia (opcjonalne) dla precyzyjnej kardynalności i kierunku
  minSource?: 0 | 1
  maxSource?: 1 | "N"
  minTarget?: 0 | 1
  maxTarget?: 1 | "N"
  direction?: "source-to-target" | "target-to-source" | "none"
}

// ============================
// Object (Logical Model) types
// ============================

export interface Concept {
  id: string
  name: string
  description?: string
  order?: number
  color?: string
}

export interface LogicalEntity {
  id: string
  conceptId: string
  name: string
  stereotype?: "Object" | "Link" | "Dictionary" | "Context" | "Informative" | string
  description?: string
  tags?: string[]
}

export interface LogicalAttribute {
  id: string
  entityId: string
  name: string
  dataType?: "String" | "Integer" | "Decimal" | "Boolean" | "Date" | "JSON" | string
  isPrimaryKey?: boolean
  isForeignKey?: boolean
  isNullable?: boolean
  isPII?: boolean
  description?: string
  order?: number
}

// ============================
// Settings types
// ============================

export interface EntityStereotypeConfig {
  id: string // e.g., "object", "link"
  label: string // e.g., "Object", "Link"
  color?: string // Tailwind color classes
  isDefault: boolean // Default types cannot be deleted
  order: number
}

export interface SourceColumnTagConfig {
  id: string // e.g., "BusinessKey"
  label: string // e.g., "BK"
  description?: string
  color: string // Tailwind bg/text classes
  borderColor: string // Tailwind border class
  isDefault: boolean // Default tags cannot be deleted
  order: number
}
