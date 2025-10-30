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
