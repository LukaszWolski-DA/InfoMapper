// Centralized UI preferences management
// Single localStorage key for all UI state (panel visibility, widths, collapsed nodes, etc.)

import { handleError, safeLocalStorage, safeJSONParse, safeJSONStringify } from "./error-handler"

const UI_PREFS_KEY = "infoMapperUIv1"

export type ObjectTreePrefs = {
  isLeftPanelVisible?: boolean
  leftPanelWidth?: number
  openConceptIds?: string[]
  openEntityIds?: string[]
}

export type ModelTreePrefs = {
  leftPanelWidth?: number
  isLeftPanelVisible?: boolean
}

export type SourcesTreePrefs = {
  leftPanelWidth?: number
  isLeftPanelVisible?: boolean
  openSystemIds?: string[]
  openDatabaseIds?: string[]
  openSchemaIds?: string[]
  openObjectIds?: string[]
}

type UIPrefs = {
  objectTree?: ObjectTreePrefs
  modelTree?: ModelTreePrefs
  sourcesTree?: SourcesTreePrefs
}

export function getUIPrefs(): UIPrefs {
  try {
    const raw = safeLocalStorage.getItem(UI_PREFS_KEY)
    if (!raw) return {}
    return safeJSONParse<UIPrefs>(raw, {}, 'ui-interaction')
  } catch (error) {
    handleError({
      context: 'ui-interaction',
      error,
      action: 'getUIPrefs',
      userMessage: undefined, // Don't show toast for read failures
    })
    return {}
  }
}

export function setUIPrefs(prefs: UIPrefs): void {
  try {
    const existing = getUIPrefs()
    const merged = { ...existing, ...prefs }
    const serialized = safeJSONStringify(merged, 'ui-interaction')
    if (serialized) {
      safeLocalStorage.setItem(UI_PREFS_KEY, serialized)
    }
  } catch (error) {
    handleError({
      context: 'ui-interaction',
      error,
      action: 'setUIPrefs',
      userMessage: undefined, // Don't show toast for UI prefs - not critical
    })
  }
}

export function getObjectTreePrefs(): ObjectTreePrefs {
  return getUIPrefs().objectTree || {}
}

export function setObjectTreePrefs(prefs: Partial<ObjectTreePrefs>): void {
  const existing = getUIPrefs()
  setUIPrefs({
    ...existing,
    objectTree: { ...existing.objectTree, ...prefs },
  })
}

export function getModelTreePrefs(): ModelTreePrefs {
  return getUIPrefs().modelTree || {}
}

export function setModelTreePrefs(prefs: Partial<ModelTreePrefs>): void {
  const existing = getUIPrefs()
  setUIPrefs({
    ...existing,
    modelTree: { ...existing.modelTree, ...prefs },
  })
}

export function getSourcesTreePrefs(): SourcesTreePrefs {
  return getUIPrefs().sourcesTree || {}
}

export function setSourcesTreePrefs(prefs: Partial<SourcesTreePrefs>): void {
  const existing = getUIPrefs()
  setUIPrefs({
    ...existing,
    sourcesTree: { ...existing.sourcesTree, ...prefs },
  })
}

