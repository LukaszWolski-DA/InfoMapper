export type SourceObjectType = "table" | "view"

export type SourceColumnTag =
  | "BusinessKey"
  | "LinkBusinessKey"
  | "ChildKey"
  | "DictionaryKey"
  | "DictionaryChildKey"
  | "PIIAttribute"

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
  tags?: SourceColumnTag[]
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

// Helper function to get tag badge properties
export function getSourceColumnTagBadge(
  tag: string,
  settings?: Array<{ id: string; label: string; color: string; borderColor: string }>
): { label: string; color: string } {
  if (!settings || settings.length === 0) {
    // Fallback to hardcoded defaults if settings not available
    const tagMap: Record<string, { label: string; color: string }> = {
      BusinessKey: { label: "BK", color: "bg-blue-100 text-blue-800 border-blue-200" },
      LinkBusinessKey: { label: "LBK", color: "bg-purple-100 text-purple-800 border-purple-200" },
      ChildKey: { label: "CK", color: "bg-green-100 text-green-800 border-green-200" },
      DictionaryKey: { label: "DK", color: "bg-orange-100 text-orange-800 border-orange-200" },
      DictionaryChildKey: { label: "DCK", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      PIIAttribute: { label: "PII", color: "bg-red-100 text-red-800 border-red-200" },
    }
    return tagMap[tag] || { label: tag, color: "bg-gray-100 text-gray-800 border-gray-200" }
  }

  const found = settings.find(s => s.id === tag)
  return found
    ? { label: found.label, color: `${found.color} ${found.borderColor}` }
    : { label: tag, color: "bg-gray-100 text-gray-800 border-gray-200" }
}













