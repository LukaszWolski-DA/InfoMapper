import type { CatalogConfig, CatalogRow } from "./catalog-types"
import type { Concept, LogicalAttribute, LogicalEntity } from "./types"

// Minimalny builder katalogu (MVP): left join od atrybutów
export function buildCatalogRows(params: {
  config: CatalogConfig
  concepts: Concept[]
  entities: LogicalEntity[]
  attributes: LogicalAttribute[]
  // mappingi i źródła: odczyt z localStorage (infoMapperStateV1.connections, infoMapperSourcesV1)
  connections: Array<{
    id: string
    type: "attribute-mapping" | "requirement-mapping"
    source: { attrId: string; itemId: string; parentType: string }
    target: { attrId: string; itemId: string; parentType: string }
  }>
  sourcesDomain?: {
    systems: { id: string; name: string }[]
    databases: { id: string; systemId: string; name: string }[]
    schemas: { id: string; databaseId: string; name: string }[]
    objects: { id: string; schemaId: string; name: string; columns: { id: string; name: string; dataType?: { base?: string; length?: number; precision?: number; scale?: number } }[] }[]
  }
}) {
  const { config, concepts, entities, attributes, connections, sourcesDomain } = params

  // indeksy pomocnicze
  const conceptById = new Map(concepts.map((c) => [c.id, c]))
  const entityById = new Map(entities.map((e) => [e.id, e]))

  // zbuduj mapę: attributeId (model) -> powiązane kolumny źródeł (N)
  const attrIdToSourceCols = new Map<string, { objectId: string; colId: string }[]>()
  for (const conn of connections) {
    if (conn.type !== "attribute-mapping") continue
    // wariant 1: source endpoint to atrybut encji (model), target endpoint to kolumna źródła
    if (conn.source.parentType === "entity" && conn.target.parentType === "source" && conn.source.attrId) {
      const entityAttrId = conn.source.attrId
      const objectId = conn.target.itemId
      const colId = conn.target.attrId
      if (!attrIdToSourceCols.has(entityAttrId)) attrIdToSourceCols.set(entityAttrId, [])
      if (colId) attrIdToSourceCols.get(entityAttrId)!.push({ objectId, colId })
      continue
    }
    // wariant 2: odwrotnie – source endpoint to kolumna źródła, target to atrybut encji
    if (conn.source.parentType === "source" && conn.target.parentType === "entity" && conn.target.attrId) {
      const entityAttrId = conn.target.attrId
      const objectId = conn.source.itemId
      const colId = conn.source.attrId
      if (!attrIdToSourceCols.has(entityAttrId)) attrIdToSourceCols.set(entityAttrId, [])
      if (colId) attrIdToSourceCols.get(entityAttrId)!.push({ objectId, colId })
      continue
    }
  }

  // indeksy źródeł
  const objById = new Map<string, { id: string; schemaId: string; name: string; columns: { id: string; name: string; dataType?: { base?: string; length?: number; precision?: number; scale?: number } }[] }>()
  const schById = new Map<string, { id: string; databaseId: string; name: string }>()
  const dbById = new Map<string, { id: string; systemId: string; name: string }>()
  const sysById = new Map<string, { id: string; name: string }>()
  if (sourcesDomain) {
    for (const o of sourcesDomain.objects) objById.set(o.id, o)
    for (const s of sourcesDomain.schemas) schById.set(s.id, s)
    for (const d of sourcesDomain.databases) dbById.set(d.id, d)
    for (const s of sourcesDomain.systems) sysById.set(s.id, s)
  }

  const rows: CatalogRow[] = []

  // lewy zbiór: atrybuty (MVP)
  const leftAttributes = attributes
    .filter((a) => {
      if (config.filters?.attributeQuery) {
        const q = config.filters.attributeQuery.toLowerCase()
        if (!a.name.toLowerCase().includes(q)) return false
      }
      if (config.filters?.entityIds?.length) {
        if (!config.filters.entityIds.includes(a.entityId)) return false
      }
      if (config.filters?.conceptIds?.length) {
        const ent = entityById.get(a.entityId)
        if (!ent || !config.filters.conceptIds.includes(ent.conceptId)) return false
      }
      return true
    })

  for (const a of leftAttributes) {
    const e = entityById.get(a.entityId)
    const concept = e ? conceptById.get(e.conceptId) : undefined

    const sourcePairs = attrIdToSourceCols.get(a.id) || []
    const isMapped = sourcePairs.length > 0
    if (config.filters?.mappedStatus === "mapped" && !isMapped) {
      continue
    }
    if (config.filters?.mappedStatus === "unmapped" && isMapped) {
      continue
    }

    if (sourcePairs.length === 0) {
      rows.push({
        conceptId: concept?.id,
        entityId: e?.id,
        attributeId: a.id,
        conceptName: concept?.name,
        entityName: e?.name,
        attributeName: a.name,
        attributeDataType: a.dataType,
        isPII: a.isPII,
        mapped: false,
        issues: ["No mapping"],
      })
      continue
    }

    for (const pair of sourcePairs) {
      const obj = objById.get(pair.objectId)
      const sch = obj ? schById.get(obj.schemaId) : undefined
      const db = sch ? dbById.get(sch.databaseId) : undefined
      const sys = db ? sysById.get(db.systemId) : undefined
      const colName = obj?.columns.find((c) => c.id === pair.colId)?.name
      const colType = obj?.columns.find((c) => c.id === pair.colId)?.dataType
      const colTypeStr = colType?.base
        ? colType.length != null
          ? `${colType.base}(${colType.length})`
          : colType.precision != null
            ? `${colType.base}(${colType.precision}${colType.scale != null ? "," + colType.scale : ""})`
            : colType.base
        : undefined

      rows.push({
        conceptId: concept?.id,
        entityId: e?.id,
        attributeId: a.id,
        conceptName: concept?.name,
        entityName: e?.name,
        attributeName: a.name,
        attributeDataType: a.dataType,
        isPII: a.isPII,
        sourceSystem: sys?.name,
        sourceDatabase: db?.name,
        sourceSchema: sch?.name,
        sourceObject: obj?.name,
        sourceColumn: colName,
        sourceDataType: colTypeStr,
        mapped: true,
      })
    }
  }

  return rows
}


