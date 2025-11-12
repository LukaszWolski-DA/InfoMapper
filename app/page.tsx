"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { TopNav } from "@/components/top-nav"
import { ViewRouter, type ViewType } from "@/app/router/view-router"
import { Sidebar } from "@/components/sidebar"
import { DiagramArea } from "@/components/diagram-area"
import { DependencyPanel } from "@/components/dependency-panel"
import { ModelViewV2 } from "@/components/model-view-v2"
import { ObjectViewV2 } from "@/components/object-view-v2"
import { InstructionsView } from "@/components/instructions-view"
import { SettingsView } from "@/components/settings-view"
import { projectEntities, projectMapping, projectModel } from "@/lib/projections"
import { SourcesViewV2 } from "@/components/sources-view-v2"
import { CatalogView } from "@/components/catalog-view"
import { RequirementsViewV2 } from "@/components/requirements-view-v2"
import type { DiagramItem, Connection, Attribute, Entity, Source, Requirement, Relationship, Concept, LogicalEntity, LogicalAttribute } from "@/lib/types"
import { z } from "zod"
import * as Schemas from "@/lib/schemas/validation"
import { importData, exportData, clearAllData } from "@/lib/import-export"
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

const LOCAL_STORAGE_KEY = "infoMapperStateV1"

function formatTime(date: Date | null) {
  if (!date) return "—"
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export default function InfoMapperPage() {
  const [activeView, setActiveView] = useState<ViewType>("instructions")

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
  const [editFormCounter, setEditFormCounter] = useState(0)
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
  const [settings, setSettings] = useState(getObjectState().settings)

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
      setSettings(s.settings)
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
            tags: z.array(z.enum(["BusinessKey", "LinkBusinessKey", "ChildKey", "DictionaryKey", "DictionaryChildKey", "PIIAttribute"])).optional(),
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
          tags: c.tags, // Pass through source column tags
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

  // Object CRUD (Concept / Entity / Attribute)
  const createConcept = (name: string = "New Concept"): Concept => addConcept(name)
  const updateConcept = (id: string, updates: Partial<Concept>) => cmdUpdateConcept(id, updates)
  const deleteConcept = (id: string) => cmdDeleteConcept(id)

  const createLogicalEntity = (conceptId: string, name: string = "New Entity"): LogicalEntity => addEntity(conceptId, name)
  const updateLogicalEntity = (id: string, updates: Partial<LogicalEntity>) => {
    cmdUpdateEntity(id, updates)
    if (Object.prototype.hasOwnProperty.call(updates, "stereotype")) {
      const nextType = normalizeStereotype(updates.stereotype as string, settings.entityStereotypes)
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
      const parsed = Schemas.PersistedStateSchema.parse(JSON.parse(raw))
      // Get current settings for normalization
      const currentSettings = getObjectState().settings
      // normalize stereotypes in diagram items on load
      const normItems = (parsed.items || []).map((it) => {
        return it.itemType === "entity" ? { ...it, objectType: normalizeStereotype(it.objectType as string, currentSettings.entityStereotypes) } : it
      }) as unknown as DiagramItem[]
      const normModelItems = (parsed.modelItems || []).map((it) => {
        return it.itemType === "entity" ? { ...it, objectType: normalizeStereotype(it.objectType as string, currentSettings.entityStereotypes) } : it
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
        const payload = {
          timestamp: new Date().toISOString(),
          items: diagramItems,
          connections,
          modelItems: modelDiagramItems,
          modelRelationships,
          concepts,
          logicalEntities,
          logicalAttributes,
          requirements: storeRequirements,
        }
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

  // Listen for sources-data-updated event (when tags are edited in Sources View)
  useEffect(() => {
    const handler = () => {
      handleSourcesDataUpdated()
    }
    window.addEventListener("sources-data-updated", handler as EventListener)
    return () => window.removeEventListener("sources-data-updated", handler as EventListener)
  }, [])

  // Track visited views for lazy mounting
  useEffect(() => {
    setVisitedViews(prev => new Set([...prev, activeView]))
    // Force connection position recalculation when returning to mapping view
    if (activeView === 'mapping') {
      setPositionUpdateCounter(prev => prev + 1)
    }
  }, [activeView])

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopNav activeView={activeView} onViewChange={setActiveView} />
      <div className="flex flex-1 overflow-hidden">
        <ViewRouter
          activeView={activeView}
          // Common state
          concepts={concepts}
          logicalEntities={logicalEntities}
          logicalAttributes={logicalAttributes}
          projectedEntities={projectedEntities}
          // Sources view
          sourcesRawData={sourcesRawData}
          handleSourcesDataUpdated={handleSourcesDataUpdated}
          // Object view handlers
          createConcept={createConcept}
          updateConcept={updateConcept}
          deleteConcept={deleteConcept}
          createLogicalEntity={createLogicalEntity}
          updateLogicalEntity={updateLogicalEntity}
          deleteLogicalEntity={deleteLogicalEntity}
          createLogicalAttribute={createLogicalAttribute}
          restoreLogicalAttribute={restoreLogicalAttribute}
          updateLogicalAttribute={updateLogicalAttribute}
          deleteLogicalAttribute={deleteLogicalAttribute}
          // Model view
          modelDiagramItems={modelDiagramItems}
          modelRelationships={modelRelationships}
          addCustomEntity={addCustomEntity}
          addModelItem={addModelItem}
          hideModelItem={hideModelItem}
          updateModelItemPosition={updateModelItemPosition}
          updateModelItemObjectType={updateModelItemObjectType}
          updateModelItemWidth={updateModelItemWidth}
          addModelRelationship={addModelRelationship}
          deleteModelRelationship={deleteModelRelationship}
          updateModelRelationship={updateModelRelationship}
          toggleModelItemCollapsed={toggleModelItemCollapsed}
          setModelAttributeFilter={setModelAttributeFilter}
          addModelCustomAttribute={addModelCustomAttribute}
          updateModelAttribute={updateModelAttribute}
          deleteModelAttribute={deleteModelAttribute}
          // Requirements view
          connections={connections}
          // Mapping view
          diagramItems={diagramItems}
          positionUpdateCounter={positionUpdateCounter}
          collapseCounter={collapseCounter}
          filterUpdateCounter={filterUpdateCounter}
          editFormCounter={editFormCounter}
          selectedAttribute={selectedAttribute}
          importedSources={importedSources}
          requirementsForUi={requirementsForUi}
          addItemToDiagram={addItemToDiagram}
          hideItem={hideItem}
          updateItemPosition={updateItemPosition}
          addConnection={addConnection}
          deleteConnection={deleteConnection}
          setSelectedAttribute={setSelectedAttribute}
          toggleItemCollapsed={toggleItemCollapsed}
          updateItemObjectType={updateItemObjectType}
          setAttributeFilter={setAttributeFilter}
          updateItemWidth={updateItemWidth}
          addCustomAttribute={addCustomAttribute}
          updateAttribute={updateAttribute}
          deleteAttribute={deleteAttribute}
          // Mapping view - Sidebar props
          entityFilter={entityFilter}
          sourceFilter={sourceFilter}
          requirementFilter={requirementFilter}
          onEntityFilterChange={setEntityFilter}
          onSourceFilterChange={setSourceFilter}
          onRequirementFilterChange={setRequirementFilter}
          onAddCustomEntity={addCustomEntity}
          onAddCustomEntityWithConcept={addCustomEntityWithConcept}
          onAddCustomSource={addCustomSource}
          onAddCustomRequirement={addCustomRequirement}
        />
      </div>
    </div>
  )
}
