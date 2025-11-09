"use client"
import { useState, useEffect } from "react"
import { ModelObjectTree } from "./model-object-tree"
import { ModelDiagramArea } from "./model-diagram-area"
import type { DiagramItem, Entity, Relationship, Attribute, LogicalEntity, LogicalAttribute, Concept } from "@/lib/types"
import { genRelationshipId } from "@/lib/id"
import { getModelTreePrefs, setModelTreePrefs } from "@/lib/ui-prefs"
import { ImButton } from "./ui/im-button"
import { IntelligentFilter } from "./ui/intelligent-filter"
import { objectFilterSchema } from "@/lib/filter/schemas"
import { useFilteredEntities } from "@/hooks/use-filtered-entities"

interface ModelViewV2Props {
  entities: Entity[]
  onAddCustomEntity: (name: string, objectType?: string) => void
  diagramItems: DiagramItem[]
  relationships: Relationship[]
  onAddItem: (item: DiagramItem) => void
  onHideItem: (itemId: string) => void
  onUpdatePosition: (itemId: string, left: number, top: number) => void
  onUpdateObjectType: (itemId: string, objectType: string) => void
  onUpdateWidth: (itemId: string, width: number) => void
  onAddRelationship: (relationship: Relationship) => void
  onDeleteRelationship: (relationshipId: string) => void
  onUpdateRelationship: (relationshipId: string, updates: Partial<{ label: string; cardinality: "1:1" | "1:N" | "M:N"; minSource: 0 | 1; maxSource: 1 | "N"; minTarget: 0 | 1; maxTarget: 1 | "N"; direction: "source-to-target" | "target-to-source" | "none" }>) => void
  onToggleCollapsed: (itemId: string) => void
  onSetAttributeFilter: (itemId: string, filter: "all" | "mapped" | "unmapped" | "keys") => void
  onAddCustomAttribute: (itemId: string, attribute: Attribute) => void
  onUpdateAttribute: (itemId: string, attrId: string, updates: Partial<Attribute>) => void
  onDeleteAttribute: (itemId: string, attrId: string) => void
  // New: synchronize with logical model (Object)
  onUpdateLogicalEntity: (id: string, updates: Partial<LogicalEntity>) => void
  onUpdateLogicalAttribute: (id: string, updates: Partial<LogicalAttribute>) => void
  concepts?: Concept[]
  logicalEntitiesRaw?: LogicalEntity[]
  logicalAttributesRaw?: LogicalAttribute[]
}

export function ModelViewV2({
  entities,
  onAddCustomEntity,
  diagramItems,
  relationships,
  onAddItem,
  onHideItem,
  onUpdatePosition,
  onUpdateObjectType,
  onUpdateWidth,
  onAddRelationship,
  onDeleteRelationship,
  onUpdateRelationship,
  onToggleCollapsed,
  onSetAttributeFilter,
  onAddCustomAttribute,
  onUpdateAttribute,
  onDeleteAttribute,
  onUpdateLogicalEntity,
  onUpdateLogicalAttribute,
  concepts = [],
  logicalEntitiesRaw = [],
  logicalAttributesRaw = [],
}: ModelViewV2Props) {
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true)
  const [leftPanelWidth, setLeftPanelWidth] = useState(340)
  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(true)
  const [showRelationshipForm, setShowRelationshipForm] = useState(false)
  const [pendingRelationship, setPendingRelationship] = useState<{
    sourceId: string
    targetId: string
  } | null>(null)
  const [editingRelationshipId, setEditingRelationshipId] = useState<string | null>(null)
  const [relationshipLabel, setRelationshipLabel] = useState("")
  const [minSource, setMinSource] = useState<0 | 1>(1)
  const [maxSource, setMaxSource] = useState<1 | "N">(1)
  const [minTarget, setMinTarget] = useState<0 | 1>(1)
  const [maxTarget, setMaxTarget] = useState<1 | "N">("N")
  const [direction, setDirection] = useState<"source-to-target" | "target-to-source" | "none">("none")

  // IntelligentFilter state (zamiast prostego entityFilter: string)
  const [filteredAttributes, setFilteredAttributes] = useState<LogicalAttribute[]>(logicalAttributesRaw)

  // Use custom hook to filter entities based on filtered attributes
  const filteredEntities = useFilteredEntities(entities, filteredAttributes, logicalAttributesRaw.length)
  const allEntities = filteredEntities

  // Funkcje callback do obsługi relationship (bez eventów)
  const handleUpdateRelationshipLabel = (id: string, label: string) => {
    if (id && typeof label === "string") {
      onUpdateRelationship(id, { label })
    }
  }

  const handleRequestEditRelationship = (rel: Relationship) => {
    setPendingRelationship({ sourceId: rel.sourceEntityId, targetId: rel.targetEntityId })
    setEditingRelationshipId(rel.id)
    setRelationshipLabel(rel.label || "")
    setMinSource(rel.minSource ?? 1)
    setMaxSource(rel.maxSource ?? (rel.cardinality === "M:N" || rel.cardinality === "1:N" ? "N" : 1))
    setMinTarget(rel.minTarget ?? 1)
    setMaxTarget(rel.maxTarget ?? (rel.cardinality === "M:N" || rel.cardinality === "1:N" ? "N" : 1))
    setDirection(rel.direction ?? "none")
    setShowRelationshipForm(true)
  }

  const handleSaveRelationship = () => {
    if (!pendingRelationship) return

    const cardinality: "1:1" | "1:N" | "M:N" =
      maxSource === "N" && maxTarget === "N"
        ? "M:N"
        : maxSource === "N" || maxTarget === "N"
          ? "1:N"
          : "1:1"

    if (editingRelationshipId) {
      onUpdateRelationship(editingRelationshipId, {
        label: relationshipLabel.trim(),
        cardinality,
        minSource,
        maxSource,
        minTarget,
        maxTarget,
        direction,
      })
      setShowRelationshipForm(false)
      setPendingRelationship(null)
      setEditingRelationshipId(null)
      setRelationshipLabel("")
      return
    }

    const newRelationship: Relationship = {
      id: genRelationshipId(),
      sourceEntityId: pendingRelationship.sourceId,
      targetEntityId: pendingRelationship.targetId,
      label: relationshipLabel.trim(),
      cardinality,
      minSource,
      maxSource,
      minTarget,
      maxTarget,
      direction,
    }
    onAddRelationship(newRelationship)
    setShowRelationshipForm(false)
    setPendingRelationship(null)
    setRelationshipLabel("")
  }

  const handleCancelRelationship = () => {
    setShowRelationshipForm(false)
    setPendingRelationship(null)
    setEditingRelationshipId(null)
    setRelationshipLabel("")
  }

  const handleCreateRelationship = (sourceId: string, targetId: string) => {
    setPendingRelationship({ sourceId, targetId })
    setEditingRelationshipId(null)
    setRelationshipLabel("")
    setMinSource(1)
    setMaxSource(1)
    setMinTarget(1)
    setMaxTarget("N")
    setDirection("none")
    setShowRelationshipForm(true)
  }

  const getEntityName = (entityId: string) => {
    const entity = entities.find((e) => e.id === entityId)
    return entity?.name || entityId
  }

  // Load persisted UI state (panel width/visibility)
  useEffect(() => {
    const prefs = getModelTreePrefs()
    if (typeof prefs.leftPanelWidth === 'number') setLeftPanelWidth(prefs.leftPanelWidth)
    if (typeof prefs.isLeftPanelVisible === 'boolean') setIsLeftPanelVisible(prefs.isLeftPanelVisible)
  }, [])

  // Update filtered attributes when logicalAttributesRaw changes
  useEffect(() => {
    setFilteredAttributes(logicalAttributesRaw)
  }, [logicalAttributesRaw])

  // Normalize stereotype to allowed list
  const normalizeStereotype = (val?: string) => {
    const allowed = ["Object", "Link", "Dictionary", "Context", "Informative"]
    if (!val) return "Object"
    const n = val.trim()
    return allowed.includes(n) ? n : "Object"
  }

  // Wrap: update object type (card) AND logical entity stereotype
  const handleUpdateObjectType = (itemId: string, objectType: string) => {
    const next = normalizeStereotype(objectType)
    onUpdateObjectType(itemId, next)
    onUpdateLogicalEntity(itemId, { stereotype: next })
  }

  // Wrap: update attribute edits from card → update local card overrides immediately AND sync logical model
  const handleUpdateCardAttribute = (_itemId: string, attrId: string, updates: Partial<Attribute>) => {
    // 1) Zaktualizuj lok. overrides (natychmiastowy badge PK/FK na karcie)
    onUpdateAttribute(_itemId, attrId, updates)

    // 2) Zmapuj do modelu logicznego
    const mapped: Partial<LogicalAttribute> = {}
    if (typeof updates.name === "string") mapped.name = updates.name
    if (Object.prototype.hasOwnProperty.call(updates, "isPII")) mapped.isPII = updates.isPII as boolean
    if (typeof updates.stereotype === "string") {
      const st = updates.stereotype
      mapped.isPrimaryKey = st === "PK"
      mapped.isForeignKey = st === "FK"
    }
    onUpdateLogicalAttribute(attrId, mapped)
  }

  return (
    <div className="flex flex-1 overflow-hidden text-sm">
      {isLeftPanelVisible ? (
        <aside className="bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto" style={{ width: `${leftPanelWidth}px`, maxWidth: '40vw', minWidth: '220px' }}>
          <h3 className="font-semibold text-sm text-gray-900 mb-2">Object</h3>
          
          <ModelObjectTree
            concepts={concepts}
            logicalEntities={logicalEntitiesRaw}
            entities={allEntities}
            diagramItems={diagramItems}
            searchQuery=""
            onSearchChange={() => {}}
            onAddCustom={onAddCustomEntity}
            isLeftPanelVisible={isLeftPanelVisible}
            onToggleLeftPanelVisible={setIsLeftPanelVisible}
          />
        </aside>
      ) : (
        <div
          className="w-2 bg-gray-100 hover:bg-gray-200 border-r border-gray-200 cursor-pointer"
          title="Show left panel (Alt+L)"
          onClick={() => setIsLeftPanelVisible(true)}
          aria-label="Show left panel"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsLeftPanelVisible(true) } }}
        />
      )}

      {isLeftPanelVisible && (
        <div
          className="w-1 cursor-col-resize bg-transparent hover:bg-gray-200"
          onMouseDown={(e) => {
            e.preventDefault()
            const startX = e.clientX
            const startWidth = leftPanelWidth
            const onMove = (ev: MouseEvent) => {
              const delta = ev.clientX - startX
              const newWidth = Math.min(560, Math.max(220, startWidth + delta))
              setLeftPanelWidth(newWidth)
            }
            const onUp = () => {
              window.removeEventListener('mousemove', onMove)
              window.removeEventListener('mouseup', onUp)
              setModelTreePrefs({ leftPanelWidth, isLeftPanelVisible })
            }
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
          }}
          title="Drag to resize"
          aria-label="Resize left panel"
        />
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* IntelligentFilter Section - fixed header (not sticky) */}
        {isFilterPanelVisible ? (
          <div className="px-4 py-3 border-b border-gray-200 bg-white shrink-0">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-900">Model (with Intelligent Filter)</h2>
                <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!isFilterPanelVisible}
                    onChange={(e) => setIsFilterPanelVisible(!e.target.checked)}
                    className="rounded"
                  />
                  Hide Panel
                </label>
              </div>
              <IntelligentFilter
                schema={objectFilterSchema}
                data={logicalAttributesRaw}
                onChange={setFilteredAttributes}
                contextBuilder={(attr) => {
                  const entity = logicalEntitiesRaw.find(e => e.id === attr.entityId)
                  const concept = entity ? concepts.find(c => c.id === entity.conceptId) : null
                  return { entity, concept }
                }}
                placeholder='Search attributes or use advanced: IsPrimaryKey = "true" AND Entity LIKE "Cust%"'
                showExamples={true}
              />
            </div>

            <div className="flex items-center justify-start gap-3">
              <button className="im-button im-button--neutral">Export JSON</button>
              <button className="im-button im-button--neutral">Import JSON</button>
              <button className="im-button im-button--danger">Clear all</button>
              <div className="ml-4 text-xs text-gray-600">
                Filtered: <span className="font-medium">{filteredAttributes.length}</span> / {logicalAttributesRaw.length} attributes
              </div>
            </div>
          </div>
        ) : (
          <div
            className="h-8 bg-gray-100 hover:bg-gray-200 border-b border-gray-200 cursor-pointer flex items-center justify-center shrink-0"
            title="Show filter panel"
            onClick={() => setIsFilterPanelVisible(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsFilterPanelVisible(true) } }}
          >
            <span className="text-xs text-gray-600">▼ Show Filter Panel</span>
          </div>
        )}

        {/* Diagram Area - takes remaining space */}
        <div className="flex-1 overflow-hidden">
          <ModelDiagramArea
          items={diagramItems}
          relationships={relationships}
          onAddItem={onAddItem}
          onHide={onHideItem}
          onUpdatePosition={onUpdatePosition}
          onUpdateObjectType={handleUpdateObjectType}
          onUpdateWidth={onUpdateWidth}
          onDeleteRelationship={onDeleteRelationship}
          onCreateRelationship={handleCreateRelationship}
          onUpdateRelationshipLabel={handleUpdateRelationshipLabel}
          onRequestEditRelationship={handleRequestEditRelationship}
          onToggleCollapsed={onToggleCollapsed}
          onSetAttributeFilter={onSetAttributeFilter}
          onAddCustomAttribute={onAddCustomAttribute}
          onUpdateAttribute={handleUpdateCardAttribute}
          onDeleteAttribute={onDeleteAttribute}
          allEntities={entities}
        />
        </div>
      </main>

      {showRelationshipForm && pendingRelationship && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-[480px]">
              <h3 className="text-lg font-semibold mb-4">{editingRelationshipId ? "Edit Relationship" : "Create Relationship"}</h3>

              <div className="mb-4 text-sm text-gray-600 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{getEntityName(pendingRelationship.sourceId)}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{getEntityName(pendingRelationship.targetId)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <label className="flex items-center gap-1">
                      <input type="radio" name="rel-dir" checked={direction === "none"} onChange={() => setDirection("none")} />
                      None
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="radio" name="rel-dir" checked={direction === "source-to-target"} onChange={() => setDirection("source-to-target")} />
                      Source→Target
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="radio" name="rel-dir" checked={direction === "target-to-source"} onChange={() => setDirection("target-to-source")} />
                      Target→Source
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Label (optional)</label>
                  <input
                    type="text"
                    className="im-filter w-full"
                    value={relationshipLabel}
                    onChange={(e) => setRelationshipLabel(e.target.value)}
                    placeholder="e.g., has, belongs to, contains (optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded p-3">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Source cardinality</div>
                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1">
                        <input type="radio" name="src-min" checked={minSource === 0} onChange={() => setMinSource(0)} /> 0
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="radio" name="src-min" checked={minSource === 1} onChange={() => setMinSource(1)} /> 1
                      </label>
                    </div>
                    <div className="flex items-center gap-3 text-xs mt-2">
                      <label className="flex items-center gap-1">
                        <input type="radio" name="src-max" checked={maxSource === 1} onChange={() => setMaxSource(1)} /> 1
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="radio" name="src-max" checked={maxSource === "N"} onChange={() => setMaxSource("N")} /> N
                      </label>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Source: {minSource}..{maxSource}</div>
                  </div>

                  <div className="border rounded p-3">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Target cardinality</div>
                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1">
                        <input type="radio" name="tgt-min" checked={minTarget === 0} onChange={() => setMinTarget(0)} /> 0
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="radio" name="tgt-min" checked={minTarget === 1} onChange={() => setMinTarget(1)} /> 1
                      </label>
                    </div>
                    <div className="flex items-center gap-3 text-xs mt-2">
                      <label className="flex items-center gap-1">
                        <input type="radio" name="tgt-max" checked={maxTarget === 1} onChange={() => setMaxTarget(1)} /> 1
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="radio" name="tgt-max" checked={maxTarget === "N"} onChange={() => setMaxTarget("N")} /> N
                      </label>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Target: {minTarget}..{maxTarget}</div>
                  </div>
                </div>

                <div className="text-xs text-gray-500">Preview: Source {minSource}..{maxSource}, Target {minTarget}..{maxTarget}</div>
              </div>

              <div className="flex gap-3 mt-6">
                <ImButton
                  variant="success"
                  onClick={handleSaveRelationship}
                  className="flex-1"
                >
                  {editingRelationshipId ? "Save" : "Create"}
                </ImButton>
                <ImButton
                  variant="neutral"
                  onClick={handleCancelRelationship}
                  className="flex-1"
                >
                  Cancel
                </ImButton>
                {editingRelationshipId && (
                  <ImButton
                    variant="danger"
                    onClick={() => {
                      if (!editingRelationshipId) return
                      onDeleteRelationship(editingRelationshipId)
                      setShowRelationshipForm(false)
                      setPendingRelationship(null)
                      setEditingRelationshipId(null)
                      setRelationshipLabel("")
                    }}
                  >
                    Remove
                  </ImButton>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

