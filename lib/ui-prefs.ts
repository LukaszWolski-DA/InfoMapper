// Centralized UI preferences management
// Single localStorage key for all UI state (panel visibility, widths, collapsed nodes, etc.)

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
    const raw = localStorage.getItem(UI_PREFS_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function setUIPrefs(prefs: UIPrefs): void {
  try {
    const existing = getUIPrefs()
    const merged = { ...existing, ...prefs }
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify(merged))
  } catch {}
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

