// Catalog – szkic interfejsów (MVP)

export type CatalogLeftSide = "attribute" | "entity" // lewy zbiór (left join)

export interface CatalogConfig {
  id: string
  title: string
  leftSide: CatalogLeftSide // np. "attribute" (domyślne)
  // widoczne kolumny (konfigurowalne przez użytkownika)
  visibleColumns: CatalogColumnId[]
  // filtry (prosty MVP – później rozszerzymy)
  filters?: Partial<{
    conceptIds: string[]
    entityIds: string[]
    attributeQuery: string // tekstowe dopasowanie po nazwie atrybutu
    sourceSystem?: string
    sourceDatabase?: string
    sourceSchema?: string
    sourceObject?: string
    mappedStatus?: "all" | "mapped" | "unmapped"
  }>
}

// Identyfikatory standardowych kolumn (możliwe rozszerzenia pluginami)
export type CatalogColumnId =
  // Logical Model - Concept
  | "concept"
  // Logical Model - Entity
  | "entity"
  | "entityStereotype"
  | "entityDescription"
  | "entityTags"
  // Logical Model - Attribute
  | "attribute"
  | "attributeDataType"
  | "attributeIsPrimaryKey"
  | "attributeIsForeignKey"
  | "attributeIsNullable"
  | "attributeIsPII"
  | "attributeDescription"
  | "attributeOrder"
  // Source System Hierarchy
  | "sourceSystem"
  | "sourceDatabase"
  | "sourceSchema"
  | "sourceObject"
  // Source Column
  | "sourceColumn"
  | "sourceDataType"
  | "sourceNullable"
  | "sourceIsPrimaryKey"
  | "sourceIsForeignKey"
  | "sourceDefaultValue"
  | "sourceComment"
  | "sourceTags"
  // Mapping & Coverage
  | "mapped"
  | "requirementIds"
  | "relationshipHint"
  // Legacy (kept for compatibility)
  | "isPII" // deprecated, use attributeIsPII

// Znormalizowany wiersz katalogu po projekcji i joinach
export interface CatalogRow {
  // klucze bazowe (do nawigacji)
  conceptId?: string
  entityId?: string
  attributeId?: string

  // Logical Model - Concept
  conceptName?: string

  // Logical Model - Entity
  entityName?: string
  entityStereotype?: string
  entityDescription?: string
  entityTags?: string[]

  // Logical Model - Attribute
  attributeName?: string
  attributeDataType?: string
  attributeIsPrimaryKey?: boolean
  attributeIsForeignKey?: boolean
  attributeIsNullable?: boolean
  attributeIsPII?: boolean
  attributeDescription?: string
  attributeOrder?: number

  // Source System Hierarchy
  sourceSystem?: string
  sourceDatabase?: string
  sourceSchema?: string
  sourceObject?: string

  // Source Column
  sourceColumn?: string
  sourceDataType?: string
  sourceNullable?: boolean
  sourceIsPrimaryKey?: boolean
  sourceIsForeignKey?: boolean
  sourceDefaultValue?: string
  sourceComment?: string
  sourceTags?: string[] // BK, LBK, CK, DK, DCK, PII

  // Mapping / Requirements / Relationships
  requirementIds?: string[]
  relationshipHint?: string

  // Coverage
  mapped?: boolean
  issues?: string[]

  // Legacy (deprecated)
  isPII?: boolean // use attributeIsPII instead
}

// Model kolumn – jak wyświetlać wartości
export interface CatalogColumnDef {
  id: CatalogColumnId
  title: string
  width?: number
  // accessor zwraca prymityw/tekst lub tablicę stringów; UI zdecyduje o renderze
  accessor: (row: CatalogRow) => string | number | boolean | string[] | undefined
}













