export type SourceObjectType = "table" | "view"

export interface SourceSystem {
  id: string
  name: string
}

export interface SourceDatabase {
  id: string
  systemId: string
  name: string
}

export interface SourceSchema {
  id: string
  databaseId: string
  name: string
}

export interface SourceColumnDataType {
  base: string
  length?: number
  precision?: number
  scale?: number
}

export interface SourceColumn {
  id: string
  objectId: string
  name: string
  dataType: SourceColumnDataType
  nullable: boolean
  isPrimaryKey?: boolean
  isForeignKey?: boolean
  defaultValue?: string
  comment?: string
}

export interface SourceObject {
  id: string
  schemaId: string
  name: string
  objectType: SourceObjectType
  columns: SourceColumn[]
  rowCount?: number
  comment?: string
}

export interface SourcesDomainData {
  systems: SourceSystem[]
  databases: SourceDatabase[]
  schemas: SourceSchema[]
  objects: SourceObject[]
}













