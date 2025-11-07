import type { Concept, LogicalAttribute, LogicalEntity, DiagramItem, Connection, Relationship } from "./types"
import { handleError, safeLocalStorage, safeJSONParse, safeJSONStringify } from "./error-handler"

type RequirementRow = {
  id: string
  name: string
  description?: string
  type?: "Functional" | "Non-functional" | "Other"
  displayId: number
}

type GlobalState = {
  concepts: Concept[]
  logicalEntities: LogicalEntity[]
  logicalAttributes: LogicalAttribute[]
  // Requirements domain (UI shape used by RequirementsView)
  requirements: RequirementRow[]
  // Mapping domain
  items: DiagramItem[]
  connections: Connection[]
  // Model domain
  modelItems: DiagramItem[]
  modelRelationships: Relationship[]
  version: number
}

type Listener = () => void

const LOCAL_STORAGE_KEY = "infoMapperStateV1"

const listeners = new Set<Listener>()

let state: GlobalState = {
  concepts: [],
  logicalEntities: [],
  logicalAttributes: [],
  requirements: [],
  items: [],
  connections: [],
  modelItems: [],
  modelRelationships: [],
  version: 1,
}

let persistTimer: number | null = null

function emit() {
  for (const l of Array.from(listeners)) {
    try {
      l()
    } catch (error) {
      // Log listener errors but don't stop notifying other listeners
      handleError({
        context: 'state-management',
        error,
        action: 'emit',
        userMessage: undefined, // Don't show toast for listener errors
      })
    }
  }
}

function schedulePersist() {
  if (persistTimer) {
    window.clearTimeout(persistTimer)
  }
  persistTimer = window.setTimeout(() => {
    try {
      // Merge into existing payload saved by the app (diagramItems, connections, etc.)
      const raw = safeLocalStorage.getItem(LOCAL_STORAGE_KEY)
      const existing = raw ? safeJSONParse(raw, {}, 'state-management') : {}

      const next = {
        ...existing,
        concepts: state.concepts,
        logicalEntities: state.logicalEntities,
        logicalAttributes: state.logicalAttributes,
        requirements: state.requirements,
        items: state.items,
        connections: state.connections,
        modelItems: state.modelItems,
        modelRelationships: state.modelRelationships,
      }

      const serialized = safeJSONStringify(next, 'state-management')
      if (serialized) {
        safeLocalStorage.setItem(LOCAL_STORAGE_KEY, serialized)
      }
    } catch (error) {
      handleError({
        context: 'state-management',
        error,
        action: 'schedulePersist',
        userMessage: 'Failed to save changes to browser storage',
      })
    }
  }, 600)
}

export function getObjectState(): GlobalState {
  return state
}

export function setObjectState(updater: (prev: GlobalState) => GlobalState) {
  state = updater(state)
  schedulePersist()
  emit()
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function initObjectStateFromStorage(): void {
  try {
    const raw = safeLocalStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return

    const parsed = safeJSONParse<any>(raw, null, 'state-management')
    if (!parsed) {
      console.warn('Failed to parse stored state, using empty state')
      return
    }

    state = {
      concepts: Array.isArray(parsed?.concepts) ? parsed.concepts : [],
      logicalEntities: Array.isArray(parsed?.logicalEntities) ? parsed.logicalEntities : [],
      logicalAttributes: Array.isArray(parsed?.logicalAttributes) ? parsed.logicalAttributes : [],
      requirements: Array.isArray(parsed?.requirements) ? parsed.requirements : [],
      items: Array.isArray(parsed?.items) ? parsed.items : [],
      connections: Array.isArray(parsed?.connections) ? parsed.connections : [],
      modelItems: Array.isArray(parsed?.modelItems) ? parsed.modelItems : [],
      modelRelationships: Array.isArray(parsed?.modelRelationships) ? parsed.modelRelationships : [],
      version: 1,
    }
    emit()
  } catch (error) {
    handleError({
      context: 'state-management',
      error,
      action: 'initObjectStateFromStorage',
      userMessage: undefined, // Don't show toast on init - just log
    })
    // Keep default empty state
  }
}


