import type { Concept, Entity, LogicalAttribute, LogicalEntity, Attribute, Source, Requirement, DiagramItem, Connection, Relationship } from "./types"
import { normalizeStereotype } from "./utils"

// Projekcja modelu logicznego do encji UI (Entity/Attribute) używanych w Mapping/Model
export function projectEntities(params: {
  concepts: Concept[]
  logicalEntities: LogicalEntity[]
  logicalAttributes: LogicalAttribute[]
}): Entity[] {
  const { logicalEntities, logicalAttributes } = params

  const byEntityId = new Map<string, LogicalAttribute[]>()
  for (const a of logicalAttributes) {
    const list = byEntityId.get(a.entityId) || []
    list.push(a)
    byEntityId.set(a.entityId, list)
  }

  const result: Entity[] = []
  for (const le of logicalEntities) {
    const attrs = (byEntityId.get(le.id) || [])
      .slice()
      .sort((x, y) => (x.order ?? 0) - (y.order ?? 0) || x.name.localeCompare(y.name))
      .map((a) => ({
        id: a.id,
        name: a.name,
        nameEn: a.name,
        stereotype: a.isPrimaryKey && a.isForeignKey ? "PK+FK"
          : a.isPrimaryKey ? "PK"
          : a.isForeignKey ? "FK"
          : "Attribute",
        isPrimaryKey: a.isPrimaryKey,
        isForeignKey: a.isForeignKey,
        isPII: a.isPII,
        dataType: a.dataType,
      }))
    result.push({
      id: le.id,
      name: le.name,
      nameEn: le.name,
      stereotype: normalizeStereotype(le.stereotype),
      status: "Custom",
      attributes: attrs,
    })
  }
  return result
}

// Pomocnicza funkcja do projekcji atrybutów dla pojedynczej encji
export function projectEntityAttributes(
  entityId: string,
  logicalAttributes: LogicalAttribute[]
): Attribute[] {
  return logicalAttributes
    .filter((a) => a.entityId === entityId)
    .sort((x, y) => (x.order ?? 0) - (y.order ?? 0) || x.name.localeCompare(y.name))
    .map((a) => ({
      id: a.id,
      name: a.name,
      nameEn: a.name,
      stereotype: a.isPrimaryKey && a.isForeignKey ? "PK+FK"
        : a.isPrimaryKey ? "PK"
        : a.isForeignKey ? "FK"
        : "Attribute",
      isPrimaryKey: a.isPrimaryKey,
      isForeignKey: a.isForeignKey,
      isPII: a.isPII,
      dataType: a.dataType,
    }))
}

// Projekcja dla widoku Mapping
export interface MappingProjection {
  entities: Entity[]
  sources: Source[]
  requirements: Requirement[]
  diagramItems: DiagramItem[]
  connections: Connection[]
}

export function projectMapping(params: {
  concepts: Concept[]
  logicalEntities: LogicalEntity[]
  logicalAttributes: LogicalAttribute[]
  diagramItems: DiagramItem[]
  connections: Connection[]
  requirements: Requirement[]
  externalSources?: Source[] // Opcjonalnie: źródła z zewnętrznego importu
}): MappingProjection {
  const { diagramItems, connections, requirements, externalSources = [] } = params

  // Encje z projekcji modelu logicznego
  const entities = projectEntities(params)

  // Requirements - already in correct format, just ensure defaults
  const requirementsUI: Requirement[] = requirements.map((r) => ({
    ...r,
    priority: r.priority || "Medium",
    status: r.status || "Proposed",
  }))

  return {
    entities,
    sources: externalSources, // Sources pochodzą z zewnętrznego importu
    requirements: requirementsUI,
    diagramItems,
    connections,
  }
}

// Projekcja dla widoku Model
export interface ModelProjection {
  entities: Entity[]
  diagramItems: DiagramItem[]
  relationships: Relationship[]
}

export function projectModel(params: {
  concepts: Concept[]
  logicalEntities: LogicalEntity[]
  logicalAttributes: LogicalAttribute[]
  diagramItems: DiagramItem[]
  relationships: Relationship[]
}): ModelProjection {
  const { diagramItems, relationships } = params
  
  // Encje z projekcji modelu logicznego
  const entities = projectEntities(params)
  
  return {
    entities,
    diagramItems,
    relationships,
  }
}

// Projekcja dla widoku Catalog
export interface CatalogProjection {
  concepts: Concept[]
  entities: LogicalEntity[]
  attributes: LogicalAttribute[]
  connections: Connection[]
}

export function projectCatalog(params: {
  concepts: Concept[]
  logicalEntities: LogicalEntity[]
  logicalAttributes: LogicalAttribute[]
  connections: Connection[]
}): CatalogProjection {
  const { concepts, logicalEntities: entities, logicalAttributes: attributes, connections } = params
  
  return {
    concepts,
    entities,
    attributes,
    connections,
  }
}

