"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"
import { DiagramArea } from "@/components/diagram-area"
import { DependencyPanel } from "@/components/dependency-panel"
import { ModelViewV2 } from "@/components/model-view-v2"
import { ObjectViewV2 } from "@/components/object-view-v2"
import { InstructionsView } from "@/components/instructions-view"
import { projectEntities, projectMapping, projectModel } from "@/lib/projections"
import { SourcesViewV2 } from "@/components/sources-view-v2"
import { CatalogView } from "@/components/catalog-view"
import { RequirementsViewV2 } from "@/components/requirements-view-v2"
import type { DiagramItem, Connection, Attribute, Entity, Source, Requirement, Relationship, Concept, LogicalEntity, LogicalAttribute } from "@/lib/types"
import { z } from "zod"
import type { SourcesDomainData } from "@/lib/source-types"
import { 
  addAttribute, 
  addConcept, 
  addEntity, 
  deleteAttribute as cmdDeleteAttribute, 
  deleteConcept as cmdDeleteConcept, 
  deleteEntity as cmdDeleteEntity, 
  updateAttribute as cmdUpdateAttribute, 
  updateConcept as cmdUpdateConcept, 
  updateEntity as cmdUpdateEntity, 
  addRequirement as cmdAddRequirement, 
  upsertCardAttribute,
  // Mapping commands
  addDiagramItem as cmdAddDiagramItem,
  hideDiagramItem as cmdHideDiagramItem,
  updateDiagramItemPosition as cmdUpdateDiagramItemPosition,
  updateDiagramItemObjectType as cmdUpdateDiagramItemObjectType,
  updateDiagramItemWidth as cmdUpdateDiagramItemWidth,
  toggleDiagramItemCollapsed as cmdToggleDiagramItemCollapsed,
  setDiagramItemAttributeFilter as cmdSetDiagramItemAttributeFilter,
  toggleDiagramItemShowOnlyMapped as cmdToggleDiagramItemShowOnlyMapped,
  addConnection as cmdAddConnection,
  deleteConnectionById as cmdDeleteConnectionById,
  // Model commands
  addModelItem as cmdAddModelItem,
  hideModelItem as cmdHideModelItem,
  updateModelItemPosition as cmdUpdateModelItemPosition,
  updateModelItemObjectType as cmdUpdateModelItemObjectType,
  updateModelItemWidth as cmdUpdateModelItemWidth,
  toggleModelItemCollapsed as cmdToggleModelItemCollapsed,
  setModelItemAttributeFilter as cmdSetModelItemAttributeFilter,
  addModelRelationship as cmdAddModelRelationship,
  deleteModelRelationship as cmdDeleteModelRelationship,
  updateModelRelationship as cmdUpdateModelRelationship,
} from "@/lib/commands"
import { getObjectState, initObjectStateFromStorage, setObjectState, subscribe } from "@/lib/store"
import { genLogicalEntityId, genConceptId, genDiagramItemId, genRequirementId } from "@/lib/id"
import { normalizeStereotype } from "@/lib/utils"
import { toast } from "sonner"
import { handleError, safeLocalStorage } from "@/lib/error-handler"

// Zod schemas for runtime validation of persisted/imported state
const DiagramItemSchema = z.object({
  itemId: z.string(),
  itemType: z.enum(["entity", "source", "requirement"]),
  left: z.number(),
  top: z.number(),
  hidden: z.boolean(),
  collapsed: z.boolean(),
  objectType: z.string().optional(),
  attributeFilter: z.enum(["all", "mapped", "unmapped", "keys"]).optional(),
  width: z.number().optional(),
  showOnlyMapped: z.boolean().optional(),
})

const ConnectionEndpointSchema = z.object({
  attrId: z.string(),
  attrName: z.string(),
  parentId: z.string(),
  parentType: z.string(),
  itemId: z.string(),
})

const ConnectionSchema = z.object({
  id: z.string(),
  type: z.enum(["attribute-mapping", "requirement-mapping"]),
  source: ConnectionEndpointSchema,
  target: ConnectionEndpointSchema,
})

const RelationshipSchema = z.object({
  id: z.string(),
  sourceEntityId: z.string(),
  targetEntityId: z.string(),
  label: z.string().optional().default(""),
  cardinality: z.enum(["1:1", "1:N", "M:N"]).optional().default("1:1"),
  minSource: z.union([z.literal(0), z.literal(1)]).optional(),
  maxSource: z.union([z.literal(1), z.literal("N")]).optional(),
  minTarget: z.union([z.literal(0), z.literal(1)]).optional(),
  maxTarget: z.union([z.literal(1), z.literal("N")]).optional(),
  direction: z.enum(["source-to-target", "target-to-source", "none"]).optional(),
})

// Object (Logical Model) schemas
const ConceptSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number().optional(),
  color: z.string().optional(),
})

const LogicalEntitySchema = z.object({
  id: z.string(),
  conceptId: z.string(),
  name: z.string().min(1),
  stereotype: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

const LogicalAttributeSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  name: z.string().min(1),
  dataType: z.string().optional(),
  isPrimaryKey: z.boolean().optional(),
  isNullable: z.boolean().optional(),
  isPII: z.boolean().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
})

const RequirementRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(["Functional", "Non-functional", "Other"]).optional(),
  displayId: z.number(),
})

const PersistedStateSchema = z.object({
  timestamp: z.string().optional(),
  items: z.array(DiagramItemSchema).default([]),
  connections: z.array(ConnectionSchema).default([]),
  modelItems: z.array(DiagramItemSchema).optional().default([]),
  modelRelationships: z.array(RelationshipSchema).optional().default([]),
  concepts: z.array(ConceptSchema).optional().default([]),
  logicalEntities: z.array(LogicalEntitySchema).optional().default([]),
  logicalAttributes: z.array(LogicalAttributeSchema).optional().default([]),
  requirements: z.array(RequirementRowSchema).optional().default([]),
})

const LOCAL_STORAGE_KEY = "infoMapperStateV1"

function formatTime(date: Date | null) {
  if (!date) return "—"
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export default function InfoMapperPage() {
  const [activeSection, setActiveSection] = useState("instructions")

  // Track which views have been visited for lazy mounting optimization
  const [visitedViews, setVisitedViews] = useState<Set<string>>(
    new Set(['instructions']) // Start with instructions view
  )

  const [modelDiagramItems, setModelDiagramItems] = useState<DiagramItem[]>([])
  const [modelRelationships, setModelRelationships] = useState<Relationship[]>([])

  const [diagramItems, setDiagramItems] = useState<DiagramItem[]>(getObjectState().items)
  const [connections, setConnections] = useState<Connection[]>(getObjectState().connections)
  const [positionUpdateCounter, setPositionUpdateCounter] = useState(0)
  const [collapseCounter, setCollapseCounter] = useState(0)
  const [filterUpdateCounter, setFilterUpdateCounter] = useState(0)
  const [entityFilter, setEntityFilter] = useState("")
  const [sourceFilter, setSourceFilter] = useState("")
  const [requirementFilter, setRequirementFilter] = useState("")
  const [selectedAttribute, setSelectedAttribute] = useState<{
    itemId: string
    itemType: "entity" | "source" | "requirement"
    attrId: string
    attrName: string
  } | null>(null)

  const [importedSources, setImportedSources] = useState<Source[]>([])
  const [sourcesRawData, setSourcesRawData] = useState<SourcesDomainData>({ systems: [], databases: [], schemas: [], objects: [] })
  // Requirements from store (single source of truth)
  const [storeRequirements, setStoreRequirements] = useState<{ id: string; name: string }[]>(getObjectState().requirements as any)
  // Mapped list for UI (Requirement shape)
  const requirementsForUi: Requirement[] = (storeRequirements as any[]).map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description || "",
    priority: "Medium",
    status: "Proposed",
  }))

  // Autosave indicator
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const saveTimerRef = useRef<number | null>(null)

  // Object (Logical Model) state
  const [concepts, setConcepts] = useState<Concept[]>(getObjectState().concepts)
  const [logicalEntities, setLogicalEntities] = useState<LogicalEntity[]>(getObjectState().logicalEntities)
  const [logicalAttributes, setLogicalAttributes] = useState<LogicalAttribute[]>(getObjectState().logicalAttributes)

  const projectedEntities: Entity[] = useMemo(
    () => projectEntities({ concepts, logicalEntities, logicalAttributes }),
    [concepts, logicalEntities, logicalAttributes]
  )

  // Projekcje dla widoków
  const mappingProjection = useMemo(
    () => projectMapping({
      concepts,
      logicalEntities,
      logicalAttributes,
      diagramItems,
      connections,
      requirements: storeRequirements,
      externalSources: importedSources,
    }),
    [concepts, logicalEntities, logicalAttributes, diagramItems, connections, storeRequirements, importedSources]
  )

  const modelProjection = useMemo(
    () => projectModel({
      concepts,
      logicalEntities,
      logicalAttributes,
      diagramItems: modelDiagramItems,
      relationships: modelRelationships,
    }),
    [concepts, logicalEntities, logicalAttributes, modelDiagramItems, modelRelationships]
  )

  // Init store from storage and subscribe UI to store changes (Object domain)
  useEffect(() => {
    initObjectStateFromStorage()
    const unsub = subscribe(() => {
      const s = getObjectState()
      setConcepts(s.concepts)
      setLogicalEntities(s.logicalEntities)
      setLogicalAttributes(s.logicalAttributes)
      setDiagramItems(s.items)
      setConnections(s.connections)
      setModelDiagramItems(s.modelItems)
      setModelRelationships(s.modelRelationships)
      setStoreRequirements((s.requirements as any) || [])
    })
    return () => unsub()
  }, [])

  // Sources → Mapping projection (from persisted Sources domain JSON)
  const SourcesDomainSchema = z.object({
    systems: z.array(z.object({ id: z.string(), name: z.string() })),
    databases: z.array(z.object({ id: z.string(), systemId: z.string(), name: z.string() })),
    schemas: z.array(z.object({ id: z.string(), databaseId: z.string(), name: z.string() })),
    objects: z.array(
      z.object({
        id: z.string(),
        schemaId: z.string(),
        name: z.string(),
        objectType: z.enum(["table", "view"]).optional(),
        rowCount: z.number().optional(),
        comment: z.string().optional(),
        columns: z.array(
          z.object({
            id: z.string(),
            objectId: z.string(),
            name: z.string(),
            dataType: z
              .object({ base: z.string(), length: z.number().optional(), precision: z.number().optional(), scale: z.number().optional() })
              .optional(),
            nullable: z.boolean().optional(),
            isPrimaryKey: z.boolean().optional(),
            isForeignKey: z.boolean().optional(),
            defaultValue: z.string().optional(),
            comment: z.string().optional(),
          }),
        ),
      }),
    ),
  })

  const formatColumnType = (dt?: { base?: string; length?: number; precision?: number; scale?: number }) => {
    if (!dt || !dt.base) return undefined
    const base = dt.base
    if (dt.length != null) return `${base}(${dt.length})`
    if (dt.precision != null) return `${base}(${dt.precision}${dt.scale != null ? "," + dt.scale : ""})`
    return base
  }

  const projectSourcesToMapping = (src: SourcesDomainData): Source[] => {
    const dbById = new Map(src.databases.map((d) => [d.id, d]))
    const schById = new Map(src.schemas.map((s) => [s.id, s]))
    return src.objects.map((obj) => {
      const sch = schById.get(obj.schemaId)
      const db = sch ? dbById.get(sch.databaseId) : undefined
      return {
        id: obj.id,
        database: db?.name || "",
        schema: sch?.name || "",
        table: obj.name,
        isGoldenSource: false,
        attributes: obj.columns.map((c) => ({
          id: c.id,
          name: c.name,
          nameEn: c.name,
          stereotype: c.isPrimaryKey ? "PK" : c.isForeignKey ? "FK" : "Attribute",
          dataType: formatColumnType(c.dataType as any),
        })),
      }
    })
  }

  const addItemToDiagram = (
    itemId: string,
    itemType: "entity" | "source" | "requirement",
    left: number,
    top: number,
  ) => {
    const exists = getObjectState().items.find((it) => it.itemId === itemId)
    if (exists) {
      if (exists.hidden) {
        setObjectState((prev) => ({
          ...prev,
          items: prev.items.map((it) => (it.itemId === itemId ? { ...it, hidden: false } : it)),
        }))
      }
      return
    }
    const newItem: DiagramItem = { itemId, itemType, left, top, hidden: false, collapsed: false, attributeFilter: "all", width: 200 }
    cmdAddDiagramItem(newItem)
  }

  const hideItem = (itemId: string) => cmdHideDiagramItem(itemId)

  const updateItemPosition = (itemId: string, left: number, top: number) => {
    cmdUpdateDiagramItemPosition(itemId, left, top)
    // Increment counter to trigger ConnectionLine updates
    setPositionUpdateCounter(prev => prev + 1)
  }

  const addConnection = (connection: Connection) => cmdAddConnection(connection)

  const deleteConnection = (connectionId: string) => cmdDeleteConnectionById(connectionId)

  const clearAllMappings = () => setObjectState((prev) => ({ ...prev, connections: [] })) // Clear all - nie ma dedykowanej komendy, ale to jest bulk operation

  const resetAppData = () => {
    try {
      // Use safe localStorage wrapper
      const keys = [
        "infoMapperStateV1",
        "infoMapperSourcesV1",
        "infoMapperRequirementsV1",
        "objectTreeUIv1",
        "infoMapperUIv1"
      ]

      let successCount = 0
      keys.forEach(key => {
        if (safeLocalStorage.removeItem(key)) {
          successCount++
        }
      })

      if (successCount === keys.length) {
        toast.success('All data cleared successfully')
      } else {
        toast.warning(`Cleared ${successCount} of ${keys.length} storage items`)
      }

      // Reload page
      setTimeout(() => {
        window.location.reload()
      }, 500) // Small delay so user sees the toast

    } catch (error) {
      handleError({
        context: 'ui-interaction',
        error,
        action: 'resetAppData',
        userMessage: 'Failed to reset application data',
      })
    }
  }

  const buildPayload = () => ({
    timestamp: new Date().toISOString(),
    items: diagramItems,
    connections,
    modelItems: modelDiagramItems,
    modelRelationships,
    concepts,
    logicalEntities,
    logicalAttributes,
    requirements: storeRequirements, // Requirements z store
  })

  // Object CRUD (Concept / Entity / Attribute)
  const createConcept = (name: string = "New Concept"): Concept => addConcept(name)
  const updateConcept = (id: string, updates: Partial<Concept>) => cmdUpdateConcept(id, updates)
  const deleteConcept = (id: string) => cmdDeleteConcept(id)

  const createLogicalEntity = (conceptId: string, name: string = "New Entity"): LogicalEntity => addEntity(conceptId, name)
  const updateLogicalEntity = (id: string, updates: Partial<LogicalEntity>) => {
    cmdUpdateEntity(id, updates)
    if (Object.prototype.hasOwnProperty.call(updates, "stereotype")) {
      const nextType = normalizeStereotype(updates.stereotype as string)
      // Synchronizuj objectType w diagramach (itemId encji = id LogicalEntity)
      const state = getObjectState()
      // Update Mapping diagram
      state.items.forEach((it) => {
        if (it.itemId === id && it.itemType === "entity") {
          cmdUpdateDiagramItemObjectType(it.itemId, nextType)
        }
      })
      // Update Model diagram
      state.modelItems.forEach((it) => {
        if (it.itemId === id && it.itemType === "entity") {
          cmdUpdateModelItemObjectType(it.itemId, nextType)
        }
      })
    }
  }
  const deleteLogicalEntity = (id: string) => cmdDeleteEntity(id)

  const createLogicalAttribute = (entityId: string, name: string = "new_attribute"): LogicalAttribute => addAttribute(entityId, name)
  const restoreLogicalAttribute = (attr: LogicalAttribute) => {
    // simple upsert behavior for restore
    setObjectState((prev) => ({ ...prev, logicalAttributes: [...prev.logicalAttributes, attr] }))
  }
  const updateLogicalAttribute = (id: string, updates: Partial<LogicalAttribute>) => cmdUpdateAttribute(id, updates)

  const upsertLogicalAttribute = (
    entityId: string,
    id: string,
    updates: Partial<LogicalAttribute> & { name?: string },
  ) => {
    setLogicalAttributes((prev) => {
      const exists = prev.some((a) => a.id === id)
      if (exists) {
        return prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
      }
      const name = updates.name || "new_attribute"
      const next: LogicalAttribute = {
        id,
        entityId,
        name,
        dataType: updates.dataType,
        isPrimaryKey: updates.isPrimaryKey,
        isForeignKey: updates.isForeignKey,
        isNullable: updates.isNullable,
        isPII: updates.isPII,
        description: updates.description,
        order: updates.order,
      }
      return [...prev, next]
    })
  }

  const deleteLogicalAttribute = (id: string) => cmdDeleteAttribute(id)

  const exportToJson = () => {
    const payload = buildPayload()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "info_mapper_export.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importFromJson = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const raw = JSON.parse(reader.result as string)
        const data = PersistedStateSchema.parse(raw)
        // Normalize objectType dla encji
        const normItems = (data.items || []).map((it) => {
          return it.itemType === "entity" ? { ...it, objectType: normalizeStereotype(it.objectType as string) } : it
        }) as unknown as DiagramItem[]
        const normModelItems = (data.modelItems || []).map((it) => {
          return it.itemType === "entity" ? { ...it, objectType: normalizeStereotype(it.objectType as string) } : it
        }) as unknown as DiagramItem[]
        setDiagramItems(normItems)
        setConnections(data.connections)
        setModelDiagramItems(normModelItems)
        setModelRelationships(data.modelRelationships as Relationship[])
        setConcepts(data.concepts)
        setLogicalEntities(data.logicalEntities)
        setLogicalAttributes(data.logicalAttributes)
        // Załaduj requirements do store
        if (data.requirements && Array.isArray(data.requirements)) {
          setObjectState(prev => ({ ...prev, requirements: data.requirements as any }))
        }
        toast.success('Data imported successfully')
      } catch (e) {
        handleError({
          context: 'import-export',
          error: e,
          action: 'importFromJson',
          userMessage: 'Invalid JSON file. Please check the file format.',
        })
      }
    }
    reader.onerror = () => {
      handleError({
        context: 'import-export',
        error: reader.error,
        action: 'importFromJson',
        userMessage: 'Failed to read file',
      })
    }
    reader.readAsText(file)
  }

  const handleImportClick = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) importFromJson(file)
    }
    input.click()
  }

  const toggleItemCollapsed = (itemId: string) => {
    cmdToggleDiagramItemCollapsed(itemId)
    // Delay counter increment to allow CSS transition to complete
    setTimeout(() => {
      setCollapseCounter(prev => prev + 1) // Clears cache in ConnectionLine
      setPositionUpdateCounter(prev => prev + 1) // Triggers position recalculation
    }, 50) // Short delay for responsive feel
  }

  const updateItemObjectType = (itemId: string, objectType: string) => cmdUpdateDiagramItemObjectType(itemId, objectType)

  const toggleShowOnlyMapped = (itemId: string) => cmdToggleDiagramItemShowOnlyMapped(itemId)

  const setAttributeFilter = (itemId: string, filter: "all" | "mapped" | "unmapped" | "keys") => {
    cmdSetDiagramItemAttributeFilter(itemId, filter)
    // Delay counter increment to allow DOM to update (same pattern as collapse)
    setTimeout(() => {
      setFilterUpdateCounter(prev => prev + 1) // Clears cache in ConnectionLine
      setPositionUpdateCounter(prev => prev + 1) // Triggers position recalculation
    }, 50)
  }

  const updateItemWidth = (itemId: string, width: number) => cmdUpdateDiagramItemWidth(itemId, width)

  const addCustomAttribute = (itemId: string, attribute: Attribute) => {
    // Nowy system: dodaj atrybut bezpośrednio do modelu logicznego przez komendę
    // Atrybuty będą automatycznie widoczne przez projekcję
    upsertCardAttribute(itemId, attribute.id, {
      name: attribute.name,
      isPrimaryKey: attribute.isPrimaryKey,
      isForeignKey: attribute.isForeignKey,
      isPII: attribute.isPII,
      dataType: attribute.dataType,
    })
  }

  const updateAttribute = (itemId: string, attrId: string, updates: Partial<Attribute>) => {
    const logicalUpdates: Partial<LogicalAttribute> = {}
    if (updates.name) logicalUpdates.name = updates.name
    if (Object.prototype.hasOwnProperty.call(updates, "isPrimaryKey")) logicalUpdates.isPrimaryKey = updates.isPrimaryKey
    if (Object.prototype.hasOwnProperty.call(updates, "isForeignKey")) logicalUpdates.isForeignKey = updates.isForeignKey
    if (Object.prototype.hasOwnProperty.call(updates, "isPII")) logicalUpdates.isPII = updates.isPII
    if (updates.dataType) logicalUpdates.dataType = updates.dataType
    
    updateLogicalAttribute(attrId, logicalUpdates)
  }

  const deleteAttribute = (itemId: string, attrId: string) => {
    deleteLogicalAttribute(attrId)
  }

  const addCustomEntity = (name: string, objectType?: string) => {
    // Znajdź lub utwórz "Default Concept"
    let targetConceptId = concepts.find(c => c.name === "Default Concept")?.id
    
    if (!targetConceptId) {
      // Utwórz "Default Concept"
      const newConcept = addConcept("Default Concept")
      targetConceptId = newConcept.id
      // Natychmiastowa synchronizacja konceptu
      setConcepts(getObjectState().concepts)
    }
    
    // Dodaj encję do store
    const newEntity = addEntity(targetConceptId, name)
    
    // Ustaw stereotype jeśli podano
    if (objectType) {
      cmdUpdateEntity(newEntity.id, { stereotype: objectType })
    }
    
    // WAŻNE: Natychmiastowa synchronizacja lokalnego state z store
    // aby projekcja była dostępna od razu dla drag & drop
    const currentState = getObjectState()
    setLogicalEntities(currentState.logicalEntities)
    setLogicalAttributes(currentState.logicalAttributes)
    
    return newEntity
  }

  const addCustomEntityWithConcept = (conceptId: string, name: string, objectType?: string) => {
    // Jeśli brak conceptId, utwórz "Default Concept"
    let targetConceptId = conceptId
    if (!targetConceptId) {
      // Sprawdź czy już istnieje "Default Concept"
      const defaultConcept = concepts.find(c => c.name === "Default Concept")
      if (defaultConcept) {
        targetConceptId = defaultConcept.id
      } else {
        // Utwórz nowy "Default Concept" przez komendę
        const newConcept = addConcept("Default Concept")
        targetConceptId = newConcept.id
        // Natychmiastowa synchronizacja
        setConcepts(getObjectState().concepts)
      }
    }

    // Dodaj encję przez komendę
    const newEntity = addEntity(targetConceptId, name)
    
    // Ustaw stereotype jeśli podano
    if (objectType) {
      cmdUpdateEntity(newEntity.id, { stereotype: objectType })
    }
    
    // WAŻNE: Natychmiastowa synchronizacja lokalnego state z store
    // aby projekcja była dostępna od razu dla drag & drop
    const currentState = getObjectState()
    setLogicalEntities(currentState.logicalEntities)
    setLogicalAttributes(currentState.logicalAttributes)
    
    return newEntity
  }

  const addCustomSource = (name: string, database?: string) => {
    const newSource: Source = {
      id: genDiagramItemId(),
      database: database || "Custom",
      schema: "dbo",
      table: name,
      isGoldenSource: false,
      attributes: [],
    }
    setImportedSources((prev) => [...prev, newSource])
  }

  const addCustomRequirement = (name: string, reqType: string) => {
    // Dodaj do store - single source of truth
      cmdAddRequirement(name.trim(), (reqType as any) || "Functional")
    // Store automatycznie persystuje do localStorage i notyfikuje subskrybentów
  }

  const addModelItem = (item: DiagramItem) => cmdAddModelItem(item)

  const hideModelItem = (itemId: string) => cmdHideModelItem(itemId)

  const updateModelItemPosition = (itemId: string, left: number, top: number) => cmdUpdateModelItemPosition(itemId, left, top)

  const updateModelItemObjectType = (itemId: string, objectType: string) => cmdUpdateModelItemObjectType(itemId, objectType)

  const updateModelItemWidth = (itemId: string, width: number) => cmdUpdateModelItemWidth(itemId, width)

  const addModelRelationship = (relationship: any) => cmdAddModelRelationship(relationship)

  const deleteModelRelationship = (relationshipId: string) => cmdDeleteModelRelationship(relationshipId)

  const updateModelRelationship = (relationshipId: string, updates: Partial<{ label: string; cardinality: "1:1" | "1:N" | "M:N" }>) => cmdUpdateModelRelationship(relationshipId, updates)

  const toggleModelItemCollapsed = (itemId: string) => {
    cmdToggleModelItemCollapsed(itemId)
    // Delay counter increment to allow CSS transition to complete
    setTimeout(() => {
      setCollapseCounter(prev => prev + 1) // Clears cache in ConnectionLine
      setPositionUpdateCounter(prev => prev + 1) // Triggers position recalculation
    }, 50) // Short delay for responsive feel
  }

  const setModelAttributeFilter = (itemId: string, filter: "all" | "mapped" | "unmapped" | "keys") => cmdSetModelItemAttributeFilter(itemId, filter)

  const addModelCustomAttribute = (itemId: string, attribute: Attribute) => {
    // Nowy system: dodaj atrybut bezpośrednio do modelu logicznego przez komendę
    upsertCardAttribute(itemId, attribute.id, {
      name: attribute.name,
      isPrimaryKey: attribute.isPrimaryKey,
      isForeignKey: attribute.isForeignKey,
      isPII: attribute.isPII,
      dataType: attribute.dataType,
    })
  }

  const updateModelAttribute = (itemId: string, attrId: string, updates: Partial<Attribute>) => {
    // Nowy system: aktualizuj bezpośrednio w modelu logicznym
    const logicalUpdates: Partial<LogicalAttribute> = {}
    if (updates.name) logicalUpdates.name = updates.name
    if (Object.prototype.hasOwnProperty.call(updates, "isPrimaryKey")) logicalUpdates.isPrimaryKey = updates.isPrimaryKey
    if (Object.prototype.hasOwnProperty.call(updates, "isForeignKey")) logicalUpdates.isForeignKey = updates.isForeignKey
    if (Object.prototype.hasOwnProperty.call(updates, "isPII")) logicalUpdates.isPII = updates.isPII
    if (updates.dataType) logicalUpdates.dataType = updates.dataType
    
    updateLogicalAttribute(attrId, logicalUpdates)
  }

  const deleteModelAttribute = (itemId: string, attrId: string) => {
    // Nowy system: usuń bezpośrednio z modelu logicznego
    deleteLogicalAttribute(attrId)
  }

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = safeLocalStorage.getItem(LOCAL_STORAGE_KEY)
      if (!raw) return
      const parsed = PersistedStateSchema.parse(JSON.parse(raw))
      // normalize stereotypes in diagram items on load
      const normItems = (parsed.items || []).map((it) => {
        return it.itemType === "entity" ? { ...it, objectType: normalizeStereotype(it.objectType as string) } : it
      }) as unknown as DiagramItem[]
      const normModelItems = (parsed.modelItems || []).map((it) => {
        return it.itemType === "entity" ? { ...it, objectType: normalizeStereotype(it.objectType as string) } : it
      }) as unknown as DiagramItem[]
      setDiagramItems(normItems)
      setConnections(parsed.connections)
      setModelDiagramItems(normModelItems)
      setModelRelationships(parsed.modelRelationships as Relationship[])
      setConcepts(parsed.concepts)
      setLogicalEntities(parsed.logicalEntities)
      setLogicalAttributes(parsed.logicalAttributes)
      // Załaduj requirements do store
      if (parsed.requirements && Array.isArray(parsed.requirements)) {
        setObjectState(prev => ({ ...prev, requirements: parsed.requirements as any }))
      }
    } catch (e) {
      handleError({
        context: 'state-management',
        error: e,
        action: 'loadStateFromStorage',
        userMessage: undefined, // Don't show toast on init - just log
      })
    }
  }, [])

  // Debounced autosave to localStorage
  useEffect(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = window.setTimeout(() => {
      try {
        const payload = buildPayload()
        const success = safeLocalStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload))
        if (success) {
          setLastSavedAt(new Date())
        }
        // Event catalog-state-updated usunięty - CatalogView subskrybuje bezpośrednio store
      } catch (e) {
        handleError({
          context: 'state-management',
          error: e,
          action: 'autosave',
          userMessage: 'Failed to save changes automatically',
        })
      }
    }, 700) // debounce

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [diagramItems, connections, modelDiagramItems, modelRelationships, concepts, logicalEntities, logicalAttributes, storeRequirements])

  // Usunięto event listenery sync-logical-attribute i delete-logical-attribute
  // Operacje na atrybutach są teraz wykonywane bezpośrednio przez komendy wywoływane z callbacks

  // Global navigation handler for Catalog → other sections
  useEffect(() => {
    const handler = (e: Event) => {
      const { section, payload } = (e as CustomEvent).detail || {}
      if (typeof section === "string") {
        setActiveSection(section)
      }
      // Optionally: could set selection in Object/Mapping based on payload
    }
    window.addEventListener("navigate-to-section", handler as EventListener)
    return () => window.removeEventListener("navigate-to-section", handler as EventListener)
  }, [])

  // Load imported Sources on mount
  useEffect(() => {
    try {
      const raw = safeLocalStorage.getItem("infoMapperSourcesV1")
      if (raw) {
        const parsed = SourcesDomainSchema.parse(JSON.parse(raw))
        const sourcesData = parsed as unknown as SourcesDomainData
        setSourcesRawData(sourcesData)
        setImportedSources(projectSourcesToMapping(sourcesData))
      }
    } catch (e) {
      handleError({
        context: 'state-management',
        error: e,
        action: 'loadImportedSources',
        userMessage: undefined, // Don't show toast on load - just log
      })
    }
  }, [])

  // Handler do aktualizacji źródeł po imporcie (callback dla SourcesView)
  const handleSourcesDataUpdated = () => {
      try {
        const raw = safeLocalStorage.getItem("infoMapperSourcesV1")
        if (raw) {
          const parsed = SourcesDomainSchema.parse(JSON.parse(raw))
          const sourcesData = parsed as unknown as SourcesDomainData
          setSourcesRawData(sourcesData)
          setImportedSources(projectSourcesToMapping(sourcesData))
        }
      } catch (err) {
        handleError({
          context: 'state-management',
          error: err,
          action: 'handleSourcesDataUpdated',
          userMessage: 'Failed to update imported sources',
        })
      }
    }

  // Requirements są wczytywane ze store przez subscribe (L181-187)
  // Brak potrzeby osobnego useEffect - requirements są już w globalnym stanie

  // Track visited views for lazy mounting
  useEffect(() => {
    setVisitedViews(prev => new Set([...prev, activeSection]))
    // Force connection position recalculation when returning to mapping view
    if (activeSection === 'mapping') {
      setPositionUpdateCounter(prev => prev + 1)
    }
  }, [activeSection])

  const renderSection = () => {
    return (
      <>
        {/* Instructions View */}
        {visitedViews.has("instructions") && (
          <div
            className={activeSection === "instructions" ? "flex flex-col" : "hidden"}
            style={{ height: '100%', width: '100%' }}
          >
            <InstructionsView />
          </div>
        )}

        {/* Sources View (v2) */}
        {visitedViews.has("sources_v2") && (
          <div
            className={activeSection === "sources_v2" ? "block" : "hidden"}
            style={{ height: '100%', width: '100%' }}
          >
            <SourcesViewV2
              data={{ systems: [], databases: [], schemas: [], objects: [] }}
              onDataUpdated={handleSourcesDataUpdated}
            />
          </div>
        )}

        {/* Object View (v2) */}
        {visitedViews.has("object_v2") && (
          <div
            className={activeSection === "object_v2" ? "block" : "hidden"}
            style={{ height: '100%', width: '100%' }}
          >
            <ObjectViewV2
              concepts={concepts}
              entities={logicalEntities}
              attributes={logicalAttributes}
              onCreateConcept={createConcept}
              onUpdateConcept={updateConcept}
              onDeleteConcept={deleteConcept}
              onCreateEntity={createLogicalEntity}
              onUpdateEntity={updateLogicalEntity}
              onDeleteEntity={deleteLogicalEntity}
              onCreateAttribute={createLogicalAttribute}
              onRestoreAttribute={restoreLogicalAttribute}
              onUpdateAttribute={updateLogicalAttribute}
              onDeleteAttribute={deleteLogicalAttribute}
            />
          </div>
        )}

        {/* Model View (v2) */}
        {visitedViews.has("model_v2") && (
          <div
            className={activeSection === "model_v2" ? "block" : "hidden"}
            style={{ height: '100%', width: '100%' }}
          >
            <ModelViewV2
              entities={modelProjection.entities}
              onAddCustomEntity={addCustomEntity}
              diagramItems={modelProjection.diagramItems}
              relationships={modelProjection.relationships}
              onAddItem={addModelItem}
              onHideItem={hideModelItem}
              onUpdatePosition={updateModelItemPosition}
              onUpdateObjectType={updateModelItemObjectType}
              onUpdateWidth={updateModelItemWidth}
              onAddRelationship={addModelRelationship}
              onDeleteRelationship={deleteModelRelationship}
              onUpdateRelationship={updateModelRelationship}
              onToggleCollapsed={toggleModelItemCollapsed}
              onSetAttributeFilter={setModelAttributeFilter}
              onAddCustomAttribute={addModelCustomAttribute}
              onUpdateAttribute={updateModelAttribute}
              onDeleteAttribute={deleteModelAttribute}
              onUpdateLogicalEntity={updateLogicalEntity}
              onUpdateLogicalAttribute={updateLogicalAttribute}
              concepts={concepts}
              logicalEntitiesRaw={logicalEntities}
              logicalAttributesRaw={logicalAttributes}
            />
          </div>
        )}

        {/* Requirements View (v2) */}
        {visitedViews.has("requirements_v2") && (
          <div
            className={activeSection === "requirements_v2" ? "block" : "hidden"}
            style={{ height: '100%', width: '100%' }}
          >
            <RequirementsViewV2
              connections={connections}
              logicalAttributes={logicalAttributes}
              logicalEntities={logicalEntities}
              concepts={concepts}
            />
          </div>
        )}

        {/* Validation View (Placeholder) */}
        {visitedViews.has("validation") && (
          <div
            className={activeSection === "validation" ? "flex-1 flex items-center justify-center bg-gray-50" : "hidden"}
            style={{ height: '100%', width: '100%' }}
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Validation</h2>
              <p className="text-gray-600">Validate mappings and check completeness</p>
              <p className="text-sm text-gray-500 mt-4">Coming soon...</p>
            </div>
          </div>
        )}

        {/* Catalog View */}
        {visitedViews.has("catalog") && (
          <div
            className={activeSection === "catalog" ? "block" : "hidden"}
            style={{ height: '100%', width: '100%' }}
          >
            <CatalogView />
          </div>
        )}

        {/* Export View (Placeholder) */}
        {visitedViews.has("export") && (
          <div
            className={activeSection === "export" ? "flex-1 flex items-center justify-center bg-gray-50" : "hidden"}
            style={{ height: '100%', width: '100%' }}
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Export</h2>
              <p className="text-gray-600">Export configurations and generate documentation</p>
              <p className="text-sm text-gray-500 mt-4">Coming soon...</p>
            </div>
          </div>
        )}

        {/* Settings View (Placeholder) */}
        {visitedViews.has("settings") && (
          <div
            className={activeSection === "settings" ? "flex-1 flex items-center justify-center bg-gray-50" : "hidden"}
            style={{ height: '100%', width: '100%' }}
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Settings</h2>
              <p className="text-gray-600">Application settings and preferences</p>
              <p className="text-sm text-gray-500 mt-4">Coming soon...</p>
            </div>
          </div>
        )}

        {/* Mapping View (Default - always rendered) */}
        <div
          className={activeSection === "mapping" ? "flex flex-1 overflow-hidden" : "hidden"}
          style={{ height: '100%', width: '100%' }}
        >
          <Sidebar
            entityFilter={entityFilter}
            sourceFilter={sourceFilter}
            requirementFilter={requirementFilter}
            onEntityFilterChange={setEntityFilter}
            onSourceFilterChange={setSourceFilter}
            onRequirementFilterChange={setRequirementFilter}
            diagramItems={diagramItems}
            entities={mappingProjection.entities}
            sources={mappingProjection.sources}
            requirements={mappingProjection.requirements}
            customEntities={mappingProjection.entities}
            customSources={mappingProjection.sources}
            customRequirements={mappingProjection.requirements}
            concepts={concepts}
            logicalEntities={logicalEntities}
            logicalAttributes={logicalAttributes}
            sourcesRawData={sourcesRawData}
            onAddCustomEntity={addCustomEntity}
            onAddCustomEntityWithConcept={addCustomEntityWithConcept}
            onAddCustomSource={addCustomSource}
            onAddCustomRequirement={addCustomRequirement}
          />
          <div className="flex-1 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-xl font-semibold text-gray-900">Mapping</h1>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Zapisano: {formatTime(lastSavedAt)}</span>
                  <div className="flex gap-2">
                  <button
                    onClick={exportToJson}
                    className="im-button im-button--neutral"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={handleImportClick}
                    className="im-button im-button--neutral"
                  >
                    Import JSON
                  </button>
                  <button
                    onClick={clearAllMappings}
                    className="im-button im-button--danger"
                  >
                    Clear All Mappings
                  </button>
                <button
                  onClick={resetAppData}
                  className="im-button im-button--danger"
                >
                  Reset app data
                </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-700">Instructions:</strong> Drag entities, sources, and requirements onto
                the diagram. Drag attributes or requirement cards to create mappings. Click an attribute to view
                dependencies.
                <br />
                <strong className="text-gray-700">Colors:</strong> Blue lines = attribute mappings, Purple lines =
                requirement mappings
              </p>
            </header>
            <DiagramArea
              diagramItems={diagramItems}
              connections={connections}
              positionUpdateCounter={positionUpdateCounter}
              collapseCounter={collapseCounter}
              filterUpdateCounter={filterUpdateCounter}
              activeView={activeSection}
              onAddItem={addItemToDiagram}
              onHideItem={hideItem}
              onUpdatePosition={updateItemPosition}
              onAddConnection={addConnection}
              onDeleteConnection={deleteConnection}
              searchQuery=""
              onSelectAttribute={setSelectedAttribute}
              onToggleCollapsed={toggleItemCollapsed}
              onUpdateObjectType={updateItemObjectType}
              onSetAttributeFilter={setAttributeFilter}
              onUpdateWidth={updateItemWidth}
              onAddCustomAttribute={addCustomAttribute}
              onUpdateAttribute={updateAttribute}
              onDeleteAttribute={deleteAttribute}
              entities={mappingProjection.entities}
              customSources={mappingProjection.sources}
              customRequirements={mappingProjection.requirements}
            />
          </div>
          <DependencyPanel
            selectedAttribute={selectedAttribute}
            connections={connections}
            entities={mappingProjection.entities}
            sources={mappingProjection.sources}
            requirements={mappingProjection.requirements}
            onClose={() => setSelectedAttribute(null)}
            onDeleteConnection={deleteConnection}
          />
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopNav activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex flex-1 overflow-hidden">{renderSection()}</div>
    </div>
  )
}
