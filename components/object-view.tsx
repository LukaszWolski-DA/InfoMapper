"use client"

import { useEffect, useState } from "react"
import type { Concept, LogicalEntity, LogicalAttribute } from "@/lib/types"
import { ObjectTree } from "./object-tree"
import { ObjectDetails } from "./object-details"
import { ObjectIssues } from "./object-issues"
import { getObjectTreePrefs, setObjectTreePrefs } from "@/lib/ui-prefs"
import { ImButton } from "./ui/im-button"

interface ObjectViewProps {
  concepts: Concept[]
  entities: LogicalEntity[]
  attributes: LogicalAttribute[]
  onCreateConcept: (name?: string) => Concept
  onUpdateConcept: (id: string, updates: Partial<Concept>) => void
  onDeleteConcept: (id: string) => void
  onCreateEntity: (conceptId: string, name?: string) => LogicalEntity
  onUpdateEntity: (id: string, updates: Partial<LogicalEntity>) => void
  onDeleteEntity: (id: string) => void
  onCreateAttribute: (entityId: string, name?: string) => LogicalAttribute
  onRestoreAttribute: (attr: LogicalAttribute) => void
  onUpdateAttribute: (id: string, updates: Partial<LogicalAttribute>) => void
  onDeleteAttribute: (id: string) => void
}

export function ObjectView({
  concepts,
  entities,
  attributes,
  onCreateConcept,
  onUpdateConcept,
  onDeleteConcept,
  onCreateEntity,
  onUpdateEntity,
  onDeleteEntity,
  onCreateAttribute,
  onRestoreAttribute,
  onUpdateAttribute,
  onDeleteAttribute,
}: ObjectViewProps) {
  const [selected, setSelected] = useState<{
    type: "concept" | "entity" | "attribute"
    id: string
  } | null>(null)
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true)
  const [leftPanelWidth, setLeftPanelWidth] = useState(340)
  const [openConceptIds, setOpenConceptIds] = useState<Set<string>>(() => {
    const prefs = getObjectTreePrefs()
    if (prefs.openConceptIds) {
      return new Set<string>(prefs.openConceptIds)
    }
    return new Set<string>(concepts[0] ? [concepts[0].id] : [])
  })
  const [openEntityIds, setOpenEntityIds] = useState<Set<string>>(() => {
    const prefs = getObjectTreePrefs()
    return new Set<string>(prefs.openEntityIds || [])
  })
  
  useEffect(() => {
    const prefs = getObjectTreePrefs()
    if (typeof prefs.isLeftPanelVisible === 'boolean') {
      setIsLeftPanelVisible(prefs.isLeftPanelVisible)
    }
  }, [])

  // Persist UI state to centralized preferences
  useEffect(() => {
    setObjectTreePrefs({
      isLeftPanelVisible,
      openConceptIds: Array.from(openConceptIds),
      openEntityIds: Array.from(openEntityIds),
    })
  }, [openConceptIds, openEntityIds, isLeftPanelVisible])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault()
        setIsLeftPanelVisible((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // load width
  useEffect(() => {
    const prefs = getObjectTreePrefs()
    if (typeof prefs.leftPanelWidth === 'number') {
      setLeftPanelWidth(prefs.leftPanelWidth)
    }
  }, [])

  return (
    <div className="flex flex-1 overflow-hidden text-sm">
      {isLeftPanelVisible ? (
      <aside className="bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto" style={{ width: `${leftPanelWidth}px`, maxWidth: '40vw', minWidth: '220px' }}>
        <ObjectTree
          concepts={concepts}
          entities={entities}
          attributes={attributes}
          selected={selected}
          onSelect={setSelected}
          openConceptIds={openConceptIds}
          openEntityIds={openEntityIds}
          onExpandOnlyConcept={(id) => {
            setOpenConceptIds(new Set([id]))
          }}
          isLeftPanelVisible={isLeftPanelVisible}
          onToggleLeftPanelVisible={(visible) => setIsLeftPanelVisible(visible)}
          onCreateEntity={onCreateEntity}
          onUpdateConcept={onUpdateConcept}
          onDeleteConcept={onDeleteConcept}
          onUpdateEntity={onUpdateEntity}
          onDeleteEntity={onDeleteEntity}
          onCreateAttribute={onCreateAttribute}
          onUpdateAttribute={onUpdateAttribute}
          onToggleConcept={(id) => {
            setOpenConceptIds((prev) => {
              const next = new Set(prev)
              if (next.has(id)) next.delete(id)
              else next.add(id)
              return next
            })
          }}
          onToggleEntity={(id) => {
            setOpenEntityIds((prev) => {
              const next = new Set(prev)
              if (next.has(id)) next.delete(id)
              else next.add(id)
              return next
            })
          }}
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
              setObjectTreePrefs({ leftPanelWidth })
            }
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
          }}
          title="Drag to resize"
          aria-label="Resize left panel"
        />
      )}
      <main className="flex-1 overflow-auto">
        <div className="flex items-center justify-start gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
          <ImButton
            variant="primary"
            onClick={() => {
              const c = onCreateConcept("New Concept")
              setSelected({ type: "concept", id: c.id })
            }}
          >
            Add Concept
          </ImButton>
          <ImButton
            variant="primary"
            disabled={!selected || (selected.type !== "concept" && selected.type !== "entity")}
            onClick={() => {
              let conceptId: string | null = null
              if (!selected) return
              if (selected.type === "concept") conceptId = selected.id
              if (selected.type === "entity") conceptId = entities.find((e) => e.id === selected.id)?.conceptId || null
              if (!conceptId) return
              const e = onCreateEntity(conceptId, "New Entity")
              setSelected({ type: "entity", id: e.id })
            }}
          >
            Add Entity
          </ImButton>
          <ImButton
            variant="primary"
            disabled={!selected || (selected.type !== "entity" && selected.type !== "attribute")}
            onClick={() => {
              if (!selected) return
              const entityId =
                selected.type === "entity"
                  ? selected.id
                  : attributes.find((a) => a.id === selected.id)?.entityId
              if (!entityId) return
              const a = onCreateAttribute(entityId, "new_attribute")
              setSelected({ type: "attribute", id: a.id })
            }}
          >
            Add Attribute
          </ImButton>
          <div className="ml-4 text-xs text-gray-600">
            {selected ? (
              <span>
                Selected: <span className="font-medium">{selected.type}</span>
              </span>
            ) : (
              <span>Selected: none</span>
            )}
          </div>
        </div>
        <ObjectDetails
          selected={selected}
          concepts={concepts}
          entities={entities}
          attributes={attributes}
          onCreateAttribute={onCreateAttribute}
          onRestoreAttribute={onRestoreAttribute}
          onUpdateConcept={onUpdateConcept}
          onDeleteConcept={(id) => {
            if (confirm("Delete concept and all its entities/attributes?")) {
              onDeleteConcept(id)
              setSelected(null)
            }
          }}
          onUpdateEntity={onUpdateEntity}
          onDeleteEntity={(id) => {
            if (confirm("Delete entity and its attributes?")) {
              onDeleteEntity(id)
              setSelected(null)
            }
          }}
          onUpdateAttribute={onUpdateAttribute}
          onDeleteAttribute={(id) => {
            if (confirm("Delete attribute?")) {
              onDeleteAttribute(id)
              setSelected(null)
            }
          }}
        />
      </main>
      <aside className="w-[260px] overflow-y-auto">
        <ObjectIssues concepts={concepts} entities={entities} attributes={attributes} onSelect={(node) => setSelected(node)} />
      </aside>
    </div>
  )
}


