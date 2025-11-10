import type { Concept, LogicalAttribute, LogicalEntity, DiagramItem, Connection, Relationship, EntityStereotypeConfig, SourceColumnTagConfig } from "./types"
import { genConceptId, genLogicalAttributeId, genLogicalEntityId, genRequirementId, genConnectionId, genRelationshipId } from "./id"
import { getObjectState, setObjectState } from "./store"

export function addConcept(name: string = "New Concept"): Concept {
  const concept: Concept = { id: genConceptId(), name }
  setObjectState((prev) => ({
    ...prev,
    concepts: [...prev.concepts, concept],
  }))
  return concept
}

export function updateConcept(id: string, updates: Partial<Concept>): void {
  setObjectState((prev) => ({
    ...prev,
    concepts: prev.concepts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
  }))
}

export function deleteConcept(id: string): void {
  setObjectState((prev) => {
    const entitiesToRemove = new Set(prev.logicalEntities.filter((e) => e.conceptId === id).map((e) => e.id))
    return {
      ...prev,
      concepts: prev.concepts.filter((c) => c.id !== id),
      logicalEntities: prev.logicalEntities.filter((e) => e.conceptId !== id),
      logicalAttributes: prev.logicalAttributes.filter((a) => !entitiesToRemove.has(a.entityId)),
    }
  })
}

export function addEntity(conceptId: string, name: string = "New Entity"): LogicalEntity {
  const entity: LogicalEntity = { id: genLogicalEntityId(), conceptId, name, stereotype: "Object" }
  setObjectState((prev) => ({
    ...prev,
    logicalEntities: [...prev.logicalEntities, entity],
  }))
  return entity
}

export function updateEntity(id: string, updates: Partial<LogicalEntity>): void {
  setObjectState((prev) => ({
    ...prev,
    logicalEntities: prev.logicalEntities.map((e) => (e.id === id ? { ...e, ...updates } : e)),
  }))
}

export function deleteEntity(id: string): void {
  setObjectState((prev) => ({
    ...prev,
    logicalEntities: prev.logicalEntities.filter((e) => e.id !== id),
    logicalAttributes: prev.logicalAttributes.filter((a) => a.entityId !== id),
  }))
}

export function addAttribute(entityId: string, name: string = "new_attribute"): LogicalAttribute {
  const current = getObjectState()
  const siblings = current.logicalAttributes.filter((a) => a.entityId === entityId)
  const nextOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.order ?? 0)) + 1 : 0
  const attr: LogicalAttribute = { id: genLogicalAttributeId(), entityId, name, order: nextOrder, dataType: "String" }
  setObjectState((prev) => ({
    ...prev,
    logicalAttributes: [...prev.logicalAttributes, attr],
  }))
  return attr
}

export function updateAttribute(id: string, updates: Partial<LogicalAttribute>): void {
  setObjectState((prev) => ({
    ...prev,
    logicalAttributes: prev.logicalAttributes.map((a) => (a.id === id ? { ...a, ...updates } : a)),
  }))
}

export function deleteAttribute(id: string): void {
  setObjectState((prev) => ({
    ...prev,
    logicalAttributes: prev.logicalAttributes.filter((a) => a.id !== id),
  }))
}

// Upsert atrybutu pochodzący z edycji karty (Mapping/Model)
export function upsertCardAttribute(
  entityId: string,
  id: string,
  updates: Partial<LogicalAttribute> & { name?: string },
): void {
  setObjectState((prev) => {
    const exists = prev.logicalAttributes.some((a) => a.id === id)
    if (exists) {
      return {
        ...prev,
        logicalAttributes: prev.logicalAttributes.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      }
    }
    const siblings = prev.logicalAttributes.filter((a) => a.entityId === entityId)
    const nextOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.order ?? 0)) + 1 : 0
    const name = updates.name || "new_attribute"
    const next: LogicalAttribute = {
      id,
      entityId,
      name,
      dataType: updates.dataType ?? "String",
      isPrimaryKey: updates.isPrimaryKey,
      isForeignKey: updates.isForeignKey,
      isNullable: updates.isNullable,
      isPII: updates.isPII,
      description: updates.description,
      order: updates.order ?? nextOrder,
    }
    return {
      ...prev,
      logicalAttributes: [...prev.logicalAttributes, next],
    }
  })
}

// =============================
// Requirements (UI row) Commands
// =============================
type RequirementRow = {
  id: string
  name: string
  description?: string
  type?: "Functional" | "Non-functional" | "Other"
  displayId: number
}

export function addRequirement(name: string, type: RequirementRow["type"] = "Functional", description?: string): RequirementRow {
  const row: RequirementRow = {
    id: genRequirementId(),
    name: name.trim(),
    description: (description ?? "").trim(),
    type,
    displayId: Math.floor(100000 + Math.random() * 900000),
  }
  setObjectState((prev) => ({ ...prev, requirements: [row, ...prev.requirements] }))
  return row
}

export function updateRequirement(id: string, updates: Partial<RequirementRow>): void {
  setObjectState((prev) => ({
    ...prev,
    requirements: prev.requirements.map((r) => (r.id === id ? { ...r, ...updates } : r)),
  }))
}

export function deleteRequirement(id: string): void {
  setObjectState((prev) => ({ ...prev, requirements: prev.requirements.filter((r) => r.id !== id) }))
}

// =============================
// Mapping Commands
// =============================
export function addDiagramItem(item: DiagramItem): void {
  setObjectState((prev) => ({ ...prev, items: [...prev.items, item] }))
}

export function hideDiagramItem(itemId: string): void {
  setObjectState((prev) => ({
    ...prev,
    items: prev.items.map((it) => (it.itemId === itemId ? { ...it, hidden: true } : it)),
  }))
}

export function updateDiagramItemPosition(itemId: string, left: number, top: number): void {
  setObjectState((prev) => ({
    ...prev,
    items: prev.items.map((it) => (it.itemId === itemId ? { ...it, left, top } : it)),
  }))
}

export function updateDiagramItemObjectType(itemId: string, objectType: string): void {
  setObjectState((prev) => ({
    ...prev,
    items: prev.items.map((it) => (it.itemId === itemId ? { ...it, objectType } : it)),
  }))
}

export function updateDiagramItemWidth(itemId: string, width: number): void {
  setObjectState((prev) => ({
    ...prev,
    items: prev.items.map((it) => (it.itemId === itemId ? { ...it, width } : it)),
  }))
}

export function toggleDiagramItemCollapsed(itemId: string): void {
  setObjectState((prev) => ({
    ...prev,
    items: prev.items.map((it) => (it.itemId === itemId ? { ...it, collapsed: !it.collapsed } : it)),
  }))
}

export function setDiagramItemAttributeFilter(itemId: string, filter: "all" | "mapped" | "unmapped" | "keys"): void {
  setObjectState((prev) => ({
    ...prev,
    items: prev.items.map((it) => (it.itemId === itemId ? { ...it, attributeFilter: filter } : it)),
  }))
}

export function toggleDiagramItemShowOnlyMapped(itemId: string): void {
  setObjectState((prev) => ({
    ...prev,
    items: prev.items.map((it) => (it.itemId === itemId ? { ...it, showOnlyMapped: !it.showOnlyMapped } : it)),
  }))
}

export function addConnection(conn: Connection): void {
  setObjectState((prev) => ({ ...prev, connections: [...prev.connections, conn] }))
}

export function deleteConnectionById(connectionId: string): void {
  setObjectState((prev) => ({ ...prev, connections: prev.connections.filter((c) => c.id !== connectionId) }))
}

export function clearConnections(): void {
  setObjectState((prev) => ({ ...prev, connections: [] }))
}

// =============================
// Model Commands
// =============================
export function addModelItem(item: DiagramItem): void {
  setObjectState((prev) => ({ ...prev, modelItems: [...prev.modelItems, item] }))
}

export function hideModelItem(itemId: string): void {
  setObjectState((prev) => ({ ...prev, modelItems: prev.modelItems.filter((it) => it.itemId !== itemId) }))
}

export function updateModelItemPosition(itemId: string, left: number, top: number): void {
  setObjectState((prev) => ({
    ...prev,
    modelItems: prev.modelItems.map((it) => (it.itemId === itemId ? { ...it, left, top } : it)),
  }))
}

export function updateModelItemObjectType(itemId: string, objectType: string): void {
  setObjectState((prev) => ({
    ...prev,
    modelItems: prev.modelItems.map((it) => (it.itemId === itemId ? { ...it, objectType } : it)),
  }))
}

export function updateModelItemWidth(itemId: string, width: number): void {
  setObjectState((prev) => ({
    ...prev,
    modelItems: prev.modelItems.map((it) => (it.itemId === itemId ? { ...it, width } : it)),
  }))
}

export function toggleModelItemCollapsed(itemId: string): void {
  setObjectState((prev) => ({
    ...prev,
    modelItems: prev.modelItems.map((it) => (it.itemId === itemId ? { ...it, collapsed: !it.collapsed } : it)),
  }))
}

export function setModelItemAttributeFilter(itemId: string, filter: "all" | "mapped" | "unmapped" | "keys"): void {
  setObjectState((prev) => ({
    ...prev,
    modelItems: prev.modelItems.map((it) => (it.itemId === itemId ? { ...it, attributeFilter: filter } : it)),
  }))
}

export function addModelRelationship(rel: Relationship): void {
  setObjectState((prev) => ({ ...prev, modelRelationships: [...prev.modelRelationships, rel] }))
}

export function deleteModelRelationship(relationshipId: string): void {
  setObjectState((prev) => ({ ...prev, modelRelationships: prev.modelRelationships.filter((r) => r.id !== relationshipId) }))
}

export function updateModelRelationship(relationshipId: string, updates: Partial<Relationship>): void {
  setObjectState((prev) => ({
    ...prev,
    modelRelationships: prev.modelRelationships.map((r) => (r.id === relationshipId ? { ...r, ...updates } : r)),
  }))
}

// =============================
// Settings Commands
// =============================

// Entity Stereotypes
export function addEntityStereotype(stereotype: EntityStereotypeConfig): void {
  setObjectState((prev) => ({
    ...prev,
    settings: {
      ...prev.settings,
      entityStereotypes: [...prev.settings.entityStereotypes, stereotype],
    },
  }))
}

export function updateEntityStereotype(id: string, updates: Partial<EntityStereotypeConfig>): void {
  setObjectState((prev) => ({
    ...prev,
    settings: {
      ...prev.settings,
      entityStereotypes: prev.settings.entityStereotypes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    },
  }))
}

export function deleteEntityStereotype(id: string): void {
  setObjectState((prev) => ({
    ...prev,
    settings: {
      ...prev.settings,
      entityStereotypes: prev.settings.entityStereotypes.filter((s) => s.id !== id),
    },
  }))
}

export function reorderEntityStereotypes(stereotypes: EntityStereotypeConfig[]): void {
  setObjectState((prev) => ({
    ...prev,
    settings: {
      ...prev.settings,
      entityStereotypes: stereotypes,
    },
  }))
}

// Source Column Tags
export function addSourceColumnTag(tag: SourceColumnTagConfig): void {
  setObjectState((prev) => ({
    ...prev,
    settings: {
      ...prev.settings,
      sourceColumnTags: [...prev.settings.sourceColumnTags, tag],
    },
  }))
}

export function updateSourceColumnTag(id: string, updates: Partial<SourceColumnTagConfig>): void {
  setObjectState((prev) => ({
    ...prev,
    settings: {
      ...prev.settings,
      sourceColumnTags: prev.settings.sourceColumnTags.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    },
  }))
}

export function deleteSourceColumnTag(id: string): void {
  setObjectState((prev) => ({
    ...prev,
    settings: {
      ...prev.settings,
      sourceColumnTags: prev.settings.sourceColumnTags.filter((t) => t.id !== id),
    },
  }))
}

export function reorderSourceColumnTags(tags: SourceColumnTagConfig[]): void {
  setObjectState((prev) => ({
    ...prev,
    settings: {
      ...prev.settings,
      sourceColumnTags: tags,
    },
  }))
}

