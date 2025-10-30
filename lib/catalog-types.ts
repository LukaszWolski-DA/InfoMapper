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
  | "concept"
  | "entity"
  | "attribute"
  | "attributeDataType"
  | "isPII"
  | "sourceSystem"
  | "sourceDatabase"
  | "sourceSchema"
  | "sourceObject"
  | "sourceColumn"
  | "sourceDataType"
  | "requirementIds"
  | "relationshipHint"
  | "mapped"

// Znormalizowany wiersz katalogu po projekcji i joinach
export interface CatalogRow {
  // klucze bazowe (do nawigacji)
  conceptId?: string
  entityId?: string
  attributeId?: string

  // Object (logical model)
  conceptName?: string
  entityName?: string
  attributeName?: string
  attributeDataType?: string
  isPII?: boolean

  // Sources (projekcja z domain JSON)
  sourceSystem?: string
  sourceDatabase?: string
  sourceSchema?: string
  sourceObject?: string
  sourceColumn?: string
  sourceDataType?: string

  // Mapping / Requirements / Relationships (MVP – uproszczone)
  requirementIds?: string[]
  relationshipHint?: string // np. label relacji encji

  // Coverage
  mapped?: boolean
  issues?: string[]
}

// Model kolumn – jak wyświetlać wartości
export interface CatalogColumnDef {
  id: CatalogColumnId
  title: string
  width?: number
  // accessor zwraca prymityw/tekst lub tablicę stringów; UI zdecyduje o renderze
  accessor: (row: CatalogRow) => string | number | boolean | string[] | undefined
}













