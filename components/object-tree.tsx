"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Concept, LogicalAttribute, LogicalEntity } from "@/lib/types"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, ChevronDown, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { ImInput } from "@/components/ui/im-input"
import { ImButton } from "@/components/ui/im-button"
import { toast } from "sonner"

interface ObjectTreeProps {
  concepts: Concept[]
  entities: LogicalEntity[]
  attributes: LogicalAttribute[]
  selected?: { type: "concept" | "entity" | "attribute"; id: string } | null
  onSelect: (node: { type: "concept" | "entity" | "attribute"; id: string }) => void
  openConceptIds?: Set<string>
  openEntityIds?: Set<string>
  onToggleConcept?: (id: string) => void
  onToggleEntity?: (id: string) => void
  onCreateEntity?: (conceptId: string, name?: string) => LogicalEntity
  onUpdateConcept?: (id: string, updates: Partial<Concept>) => void
  onDeleteConcept?: (id: string) => void
  onUpdateEntity?: (id: string, updates: Partial<LogicalEntity>) => void
  onDeleteEntity?: (id: string) => void
  onCreateAttribute?: (entityId: string, name?: string) => LogicalAttribute
  onUpdateAttribute?: (id: string, updates: Partial<LogicalAttribute>) => void
  onExpandOnlyConcept?: (id: string) => void
  isLeftPanelVisible?: boolean
  onToggleLeftPanelVisible?: (visible: boolean) => void
  // Optional controlled props for read-only mode (Mapping sidebar)
  query?: string
  setQuery?: (value: string) => void
  filterHasPk?: boolean
  setFilterHasPk?: (value: boolean) => void
  filterHasPii?: boolean
  setFilterHasPii?: (value: boolean) => void
  filterOnlyIssues?: boolean
  setFilterOnlyIssues?: (value: boolean) => void
}

export function ObjectTree({ 
  concepts, entities, attributes, selected, onSelect, 
  openConceptIds, openEntityIds, onToggleConcept, onToggleEntity, 
  onCreateEntity, onUpdateConcept, onDeleteConcept, onUpdateEntity, onDeleteEntity, 
  onCreateAttribute, onUpdateAttribute, onExpandOnlyConcept, 
  isLeftPanelVisible, onToggleLeftPanelVisible,
  // Controlled props (can be passed from parent)
  query: controlledQuery, setQuery: controlledSetQuery,
  filterHasPk: controlledFilterHasPk, setFilterHasPk: controlledSetFilterHasPk,
  filterHasPii: controlledFilterHasPii, setFilterHasPii: controlledSetFilterHasPii,
  filterOnlyIssues: controlledFilterOnlyIssues, setFilterOnlyIssues: controlledSetFilterOnlyIssues
}: ObjectTreeProps) {
  // Use controlled values if provided, otherwise use internal state
  const [internalQuery, internalSetQuery] = useState("")
  const [internalFilterHasPk, internalSetFilterHasPk] = useState(false)
  const [internalFilterHasPii, internalSetFilterHasPii] = useState(false)
  const [internalFilterOnlyIssues, internalSetFilterOnlyIssues] = useState(false)
  
  const query = controlledQuery ?? internalQuery
  const setQuery = controlledSetQuery ?? internalSetQuery
  const filterHasPk = controlledFilterHasPk ?? internalFilterHasPk
  const setFilterHasPk = controlledSetFilterHasPk ?? internalSetFilterHasPk
  const filterHasPii = controlledFilterHasPii ?? internalFilterHasPii
  const setFilterHasPii = controlledSetFilterHasPii ?? internalSetFilterHasPii
  const filterOnlyIssues = controlledFilterOnlyIssues ?? internalFilterOnlyIssues
  const setFilterOnlyIssues = controlledSetFilterOnlyIssues ?? internalSetFilterOnlyIssues
  
  const [renaming, setRenaming] = useState<{ type: "concept" | "entity"; id: string } | null>(null)
  const treeRef = useRef<HTMLDivElement>(null)
  const [dropTargetEntityId, setDropTargetEntityId] = useState<string | null>(null)
  const [dropTargetConceptId, setDropTargetConceptId] = useState<string | null>(null)

  const addAlphaToHex = (hex: string, alphaHex: string = "26") => {
    if (typeof hex !== "string") return hex
    const m = /^#([0-9a-fA-F]{6})$/.exec(hex)
    if (!m) return hex
    return `${hex}${alphaHex}`
  }

  const grouped = useMemo(() => {
    const conceptIdToEntities: Record<string, LogicalEntity[]> = {}
    for (const c of concepts) conceptIdToEntities[c.id] = []
    for (const e of entities) {
      if (!conceptIdToEntities[e.conceptId]) conceptIdToEntities[e.conceptId] = []
      conceptIdToEntities[e.conceptId].push(e)
    }
    const entityIdToAttributes: Record<string, LogicalAttribute[]> = {}
    for (const a of attributes) {
      if (!entityIdToAttributes[a.entityId]) entityIdToAttributes[a.entityId] = []
      entityIdToAttributes[a.entityId].push(a)
    }
    return { conceptIdToEntities, entityIdToAttributes }
  }, [concepts, entities, attributes])

  const match = (text: string) => text.toLowerCase().includes(query.toLowerCase())

  // Auto-expand results on search
  useEffect(() => {
    if (!onToggleConcept || !onToggleEntity || !openConceptIds || !openEntityIds) return
    if (!query) return
    const matchingConceptIds = new Set<string>()
    const matchingEntityIds = new Set<string>()
    // Any concept that matches itself or has an entity/attribute match
    concepts.forEach((c) => {
      const ents = grouped.conceptIdToEntities[c.id] || []
      const conceptMatches = match(c.name)
      let entityOrAttrMatches = false
      for (const e of ents) {
        const eMatches = match(e.name)
        const attrs = grouped.entityIdToAttributes[e.id] || []
        const anyAttrMatches = attrs.some((a) => match(a.name))
        if (eMatches || anyAttrMatches) {
          entityOrAttrMatches = true
          matchingEntityIds.add(e.id)
        }
      }
      if (conceptMatches || entityOrAttrMatches) matchingConceptIds.add(c.id)
    })
    // Open necessary concepts/entities
    matchingConceptIds.forEach((id) => {
      if (!openConceptIds.has(id)) onToggleConcept(id)
    })
    matchingEntityIds.forEach((id) => {
      if (!openEntityIds.has(id)) onToggleEntity(id)
    })
  }, [query, concepts, grouped, onToggleConcept, onToggleEntity, openConceptIds, openEntityIds])

  return (
    <div className="h-full flex flex-col">
      <div className="mb-3 space-y-2">
        {/* Poziom 1: filtr wiodący (wyszukiwarka) */}
        <div className="flex items-center gap-2" role="search">
          <ImInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search concepts/entities/attributes"
            aria-label="Search in object tree"
          />
        </div>

        {/* Poziom 2: filtry Has PK / Has PII / Only issues */}
        <div className="flex items-center gap-3 text-xs text-gray-700">
          <label className="inline-flex items-center gap-1">
            <Checkbox checked={filterHasPk} onCheckedChange={(v) => setFilterHasPk(!!v)} /> Has PK
          </label>
          <label className="inline-flex items-center gap-1">
            <Checkbox checked={filterHasPii} onCheckedChange={(v) => setFilterHasPii(!!v)} /> Has PII
          </label>
          <label className="inline-flex items-center gap-1">
            <Checkbox checked={filterOnlyIssues} onCheckedChange={(v) => setFilterOnlyIssues(!!v)} /> Only issues
          </label>
          <label className="inline-flex items-center gap-1">
            <Checkbox checked={!isLeftPanelVisible ? true : false} onCheckedChange={(v) => onToggleLeftPanelVisible && onToggleLeftPanelVisible(!v)} /> Hide panel
          </label>
        </div>

        {/* Poziom 3: przyciski Expand/Collapse - styl jak "Add Concept" */}
        {openConceptIds && onToggleConcept && (
          <div className="flex items-center gap-2">
            {(() => {
              let selectedConceptId: string | null = null
              if (selected?.type === "concept") selectedConceptId = selected.id
              else if (selected?.type === "entity") selectedConceptId = entities.find(en => en.id === selected.id)?.conceptId || null
              else if (selected?.type === "attribute") {
                const entId = attributes.find(a => a.id === selected.id)?.entityId
                selectedConceptId = entId ? (entities.find(en => en.id === entId)?.conceptId || null) : null
              }
              return (
                <ImButton
                  variant="primary"
                  title="Expand current concept only"
                  disabled={!selectedConceptId}
                  onClick={() => {
                    if (selectedConceptId && onExpandOnlyConcept) onExpandOnlyConcept(selectedConceptId)
                  }}
                >
                  Expand current only
                </ImButton>
              )
            })()}
            <ImButton
              variant="primary"
              title="Expand all"
              onClick={() => {
                concepts.forEach((c) => {
                  if (!openConceptIds.has(c.id)) onToggleConcept(c.id)
                })
              }}
            >
              Expand all
            </ImButton>
            <ImButton
              variant="primary"
              title="Collapse all"
              onClick={() => {
                openConceptIds.forEach((id) => onToggleConcept(id))
              }}
            >
              Collapse all
            </ImButton>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto" ref={treeRef}
        onKeyDown={(ev) => {
          const container = treeRef.current
          if (!container) return
          const items = Array.from(container.querySelectorAll<HTMLElement>('[data-tree-item="true"]'))
          if (items.length === 0) return
          const active = document.activeElement as HTMLElement | null
          const idx = active ? items.indexOf(active) : -1
          if (ev.key === 'ArrowDown') {
            ev.preventDefault()
            const next = items[Math.min(items.length - 1, Math.max(0, idx + 1))]
            next?.focus()
          } else if (ev.key === 'ArrowUp') {
            ev.preventDefault()
            const prev = items[Math.max(0, Math.min(items.length - 1, idx - 1))]
            prev?.focus()
          } else if (ev.key === 'Home') {
            ev.preventDefault(); items[0]?.focus()
          } else if (ev.key === 'End') {
            ev.preventDefault(); items[items.length - 1]?.focus()
          } else if (ev.key === 'Enter' || ev.key === ' ') {
            const target = active
            if (target) {
              ev.preventDefault()
              ;(target as HTMLElement).click()
            }
          }
        }}
      >
        <Accordion type="multiple" value={openConceptIds ? Array.from(openConceptIds) : undefined} onValueChange={(vals) => {
          if (!onToggleConcept || !openConceptIds) return
          const incoming = new Set<string>(vals as string[])
          const current = openConceptIds
          // sync by toggling differences
          current.forEach((id) => { if (!incoming.has(id)) onToggleConcept(id) })
          incoming.forEach((id) => { if (!current.has(id)) onToggleConcept(id) })
        }} className="w-full" role="tree" aria-label="Object hierarchy">
          {concepts.map((c) => {
            const ents = grouped.conceptIdToEntities[c.id] || []
            // compute entity-level filters
            const entsFiltered = ents.filter((e) => {
              const attrs = grouped.entityIdToAttributes[e.id] || []
              const hasPk = attrs.some((a) => a.isPrimaryKey)
              const hasPii = attrs.some((a) => a.isPII)
              const passesFilters = (!filterHasPk || hasPk) && (!filterHasPii || hasPii) && (!filterOnlyIssues || !hasPk)
              const matchesQuery = query === "" || match(e.name) || attrs.some((a) => match(a.name))
              return passesFilters && matchesQuery
            })
            const showConcept = (query === "" && entsFiltered.length > 0) || match(c.name) || entsFiltered.length > 0
            if (!showConcept) return null
            const isSelected = selected?.type === "concept" && selected.id === c.id
            const isOpen = openConceptIds?.has(c.id)
            return (
              <AccordionItem key={c.id} value={c.id} className="border-b-0 pb-1" role="treeitem" aria-expanded={isOpen} aria-level={1}
                onDragOver={(ev) => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; setDropTargetConceptId(c.id) }}
                onDragEnter={() => setDropTargetConceptId(c.id)}
                onDragLeave={() => setDropTargetConceptId((prev) => (prev === c.id ? null : prev))}
                onDrop={(ev) => {
                  ev.preventDefault(); ev.stopPropagation()
                  const entityId = ev.dataTransfer.getData('application/x-entity-id') || ev.dataTransfer.getData('text/plain')
                  if (!entityId) return
                  const ent = entities.find((x) => x.id === entityId)
                  if (!ent || ent.conceptId === c.id) return
                  const prevConceptId = ent.conceptId
                  if (onUpdateEntity) onUpdateEntity(ent.id, { conceptId: c.id })
                  if (onToggleConcept && openConceptIds && !openConceptIds.has(c.id)) onToggleConcept(c.id)
                  onSelect({ type: 'entity', id: ent.id })
                  toast('Entity moved', { action: { label: 'Undo', onClick: () => onUpdateEntity && onUpdateEntity(ent.id, { conceptId: prevConceptId }) } })
                  setDropTargetConceptId(null)
                }}
              >
                <AccordionTrigger
                  aria-controls={`concept-${c.id}-panel`}
                  onClick={() => onSelect({ type: "concept", id: c.id })}
                  className={`${isSelected ? "bg-gray-200" : dropTargetConceptId === c.id ? "bg-blue-50 ring-2 ring-blue-300" : "hover:bg-gray-100"} px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-300 items-center [&>svg]:hidden`}
                  data-tree-item="true"
                  tabIndex={isSelected ? 0 : -1}
                  style={{ backgroundColor: c.color ? addAlphaToHex(c.color) as any : undefined, textDecoration: 'none' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs">
                      {renaming?.type === "concept" && renaming.id === c.id ? (
                        <input
                          autoFocus
                          defaultValue={c.name}
                          className="px-1 py-0.5 border border-gray-300 rounded text-xs"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation()
                              const v = (e.target as HTMLInputElement).value.trim()
                              if (v && onUpdateConcept) onUpdateConcept(c.id, { name: v })
                              setRenaming(null)
                            } else if (e.key === "Escape") {
                              setRenaming(null)
                            }
                          }}
                          onBlur={(e) => {
                            const v = (e.target as HTMLInputElement).value.trim()
                            if (v && onUpdateConcept) onUpdateConcept(c.id, { name: v })
                            setRenaming(null)
                          }}
                        />
                      ) : (
                        c.name
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                      title={isOpen ? "Collapse" : "Expand"}
                    >
                      {isOpen ? "▼" : "▶"}
                    </span>
                    {/* Hide per-concept Expand only */}
                    {/* <span className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300">Expand only</span> */}
                    {/* Hide count badge */}
                    {/* <Badge variant="outline">{ents.length}</Badge> */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="p-1 rounded hover:bg-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300" onClick={(e) => e.stopPropagation()} aria-label="Concept actions" role="button" tabIndex={0}>
                          <MoreHorizontal className="w-4 h-4 text-gray-600" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={(ev) => { ev.stopPropagation(); setRenaming({ type: "concept", id: c.id })}}>Rename (F2)</DropdownMenuItem>
                        <DropdownMenuItem onClick={(ev) => { ev.stopPropagation(); if (onCreateEntity) onCreateEntity(c.id, "New Entity") }}>Add Entity</DropdownMenuItem>
                        <DropdownMenuItem onClick={(ev) => { ev.stopPropagation(); if (onDeleteConcept) onDeleteConcept(c.id) }} className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="mt-1" id={`concept-${c.id}-panel`} role="group">
                  {ents.map((e) => {
                    const attrs = grouped.entityIdToAttributes[e.id] || []
                    const hasPk = attrs.some((a) => a.isPrimaryKey)
                    const hasPii = attrs.some((a) => a.isPII)
                    const passesFilters = (!filterHasPk || hasPk) && (!filterHasPii || hasPii) && (!filterOnlyIssues || !hasPk)
                    // Smart filter: entity is shown if query matches entity, concept, or any child attribute
                    const matchesQuery = query === "" || match(e.name) || attrs.some((a) => match(a.name)) || match(c.name)
                    if (!passesFilters || !matchesQuery) return null
                    const entSelected = selected?.type === "entity" && selected.id === e.id
                    const entOpen = openEntityIds?.has(e.id) ?? false
                    return (
                      <Collapsible key={e.id} open={entOpen} onOpenChange={() => onToggleEntity && onToggleEntity(e.id)}>
                        <div className={`w-full text-left px-2 py-1 rounded flex items-center justify-between ${entSelected ? "bg-gray-100" : dropTargetEntityId === e.id ? "bg-blue-50 ring-2 ring-blue-300" : "hover:bg-gray-50"} focus:outline-none focus:ring-2 focus:ring-gray-300`}
                          role="treeitem"
                          aria-expanded={entOpen}
                          aria-level={2}
                          onDragOver={(ev) => {
                            // allow drop anywhere on the entity header
                            ev.preventDefault()
                            ev.dataTransfer.dropEffect = "move"
                            setDropTargetEntityId(e.id)
                          }}
                          onDragEnter={() => setDropTargetEntityId(e.id)}
                          onDrop={(ev) => {
                            ev.preventDefault()
                            ev.stopPropagation()
                            let attrId = ev.dataTransfer.getData("application/x-attr-id")
                            if (!attrId) {
                              attrId = ev.dataTransfer.getData("text/plain")
                            }
                            if (!attrId) return
                            const sourceEntity = entities.find((en) => (attributes.find((at) => at.id === attrId)?.entityId) === en.id)
                            const targetEntity = e
                            if (!sourceEntity || !targetEntity) return
                            if (sourceEntity.id === targetEntity.id) return
                            const moved = attributes.find((at) => at.id === attrId)
                            if (!moved) return
                            // warning if moving last PK from source
                            const sourceAttrs = attributes.filter((at) => at.entityId === sourceEntity.id)
                            const pkCount = sourceAttrs.filter((at) => at.isPrimaryKey).length
                            const wasPk = !!moved.isPrimaryKey
                            const doMove = () => {
                              // set order at end of target
                              const targetSiblings = attributes.filter((at) => at.entityId === targetEntity.id)
                              const nextOrder = targetSiblings.length > 0 ? Math.max(...targetSiblings.map((s) => s.order ?? 0)) + 1 : 0
                              if (onUpdateAttribute) onUpdateAttribute(moved.id, { entityId: targetEntity.id, order: nextOrder })
                              if (onToggleEntity && openEntityIds && !openEntityIds.has(targetEntity.id)) onToggleEntity(targetEntity.id)
                              onSelect({ type: "entity", id: targetEntity.id })
                              toast("Attribute moved", { action: { label: "Undo", onClick: () => onUpdateAttribute && onUpdateAttribute(moved.id, { entityId: sourceEntity.id }) } })
                              setDropTargetEntityId(null)
                            }
                            if (wasPk && pkCount === 1) {
                              toast("Moving last PK from source entity", { action: { label: "Proceed", onClick: doMove } })
                            } else {
                              doMove()
                            }
                          }}
                          onDragLeave={() => setDropTargetEntityId((prev) => (prev === e.id ? null : prev))}
                          onKeyDown={(ev) => {
                          if (ev.key === 'F2') setRenaming({ type: 'entity', id: e.id })
                        }}>
                          <div className="flex items-center gap-2">
                            <CollapsibleTrigger className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300" aria-label={entOpen ? `Collapse ${e.name}` : `Expand ${e.name}`} data-tree-item="true" tabIndex={entSelected ? 0 : -1}>
                              {entOpen ? "▼" : "▶"}
                            </CollapsibleTrigger>
                            {renaming?.type === "entity" && renaming.id === e.id ? (
                              <input
                                autoFocus
                                defaultValue={e.name}
                                className="px-1 py-0.5 border border-gray-300 rounded text-sm"
                                onKeyDown={(ev) => {
                                  if (ev.key === 'Enter') {
                                    ev.stopPropagation()
                                    const v = (ev.target as HTMLInputElement).value.trim()
                                    if (v && onUpdateEntity) onUpdateEntity(e.id, { name: v })
                                    setRenaming(null)
                                  } else if (ev.key === 'Escape') {
                                    setRenaming(null)
                                  }
                                }}
                                onBlur={(ev) => {
                                  const v = (ev.target as HTMLInputElement).value.trim()
                                  if (v && onUpdateEntity) onUpdateEntity(e.id, { name: v })
                                  setRenaming(null)
                                }}
                              />
                            ) : (
                              <button
                                onClick={() => onSelect({ type: "entity", id: e.id })}
                                className="text-left focus:outline-none focus:ring-2 focus:ring-gray-300"
                                draggable
                                onDragStart={(ev) => {
                                  ev.stopPropagation()
                                  ev.dataTransfer.setData('application/json', JSON.stringify({
                                    itemId: e.id,
                                    itemType: 'entity'
                                  }))
                                  ev.dataTransfer.effectAllowed = 'move'
                                }}
                                onDragOver={(ev) => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move' }}
                                onDrop={(ev) => {
                                  ev.preventDefault(); ev.stopPropagation()
                                  let attrId = ev.dataTransfer.getData('application/x-attr-id') || ev.dataTransfer.getData('text/plain')
                                  if (!attrId) return
                                  const sourceEntity = entities.find((en) => (attributes.find((at) => at.id === attrId)?.entityId) === en.id)
                                  const targetEntity = e
                                  if (!sourceEntity || !targetEntity || sourceEntity.id === targetEntity.id) return
                                  const moved = attributes.find((at) => at.id === attrId)
                                  if (!moved) return
                                  const sourceAttrs = attributes.filter((at) => at.entityId === sourceEntity.id)
                                  const pkCount = sourceAttrs.filter((at) => at.isPrimaryKey).length
                                  const wasPk = !!moved.isPrimaryKey
                                  const doMove = () => {
                                    const targetSiblings = attributes.filter((at) => at.entityId === targetEntity.id)
                                    const nextOrder = targetSiblings.length > 0 ? Math.max(...targetSiblings.map((s) => s.order ?? 0)) + 1 : 0
                                    if (onUpdateAttribute) onUpdateAttribute(moved.id, { entityId: targetEntity.id, order: nextOrder })
                                    if (onToggleEntity && openEntityIds && !openEntityIds.has(targetEntity.id)) onToggleEntity(targetEntity.id)
                                    onSelect({ type: 'entity', id: targetEntity.id })
                                    toast('Attribute moved', { action: { label: 'Undo', onClick: () => onUpdateAttribute && onUpdateAttribute(moved.id, { entityId: sourceEntity.id }) } })
                                  }
                                  if (wasPk && pkCount === 1) {
                                    toast('Moving last PK from source entity', { action: { label: 'Proceed', onClick: doMove } })
                                  } else {
                                    doMove()
                                  }
                                }}
                                data-tree-item="true"
                                tabIndex={entSelected ? 0 : -1}
                              >
                                <span className="text-gray-900 font-semibold text-xs">{e.name}</span>
                                {e.stereotype && (
                                  <span className="ml-2 text-[11px] text-gray-500">{e.stereotype}</span>
                                )}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Subtle No PK: red text, white background */}
                            {!hasPk && (
                              <span className="text-xs text-red-600 bg-white px-1 py-0.5 rounded">No PK</span>
                            )}
                            {/* PII badge styled same as PII token */}
                            {hasPii && <span className="badge badge--pii">PII</span>}
                            {/* Hide count badge */}
                            {/* <Badge variant="outline">{attrs.length}</Badge> */}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div className="p-1 rounded hover:bg-gray-100 cursor-pointer" onClick={(e) => e.stopPropagation()} aria-label="Entity actions" role="button" tabIndex={0}>
                                <MoreHorizontal className="w-4 h-4 text-gray-600" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={(ev) => { ev.stopPropagation(); setRenaming({ type: "entity", id: e.id })}}>Rename (F2)</DropdownMenuItem>
                              <DropdownMenuItem onClick={(ev) => {
                                ev.stopPropagation()
                                if (onCreateAttribute) {
                                  const created = onCreateAttribute(e.id, "new_attribute")
                                  // ensure entity is expanded to show new attribute
                                  if (onToggleEntity && openEntityIds && !openEntityIds.has(e.id)) {
                                    onToggleEntity(e.id)
                                  }
                                  onSelect({ type: "attribute", id: created.id })
                                }
                              }}>Add Attribute</DropdownMenuItem>
                              <DropdownMenuItem onClick={(ev) => { ev.stopPropagation(); if (onDeleteEntity) onDeleteEntity(e.id) }} className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CollapsibleContent className="ml-8" id={`entity-${e.id}-panel`} role="group"
                          onDragOver={(ev) => {
                            ev.preventDefault()
                            ev.dataTransfer.dropEffect = "move"
                            setDropTargetEntityId(e.id)
                          }}
                          onDrop={(ev) => {
                            ev.preventDefault()
                            ev.stopPropagation()
                            let attrId = ev.dataTransfer.getData("application/x-attr-id")
                            if (!attrId) attrId = ev.dataTransfer.getData("text/plain")
                            if (!attrId) return
                            const sourceEntity = entities.find((en) => (attributes.find((at) => at.id === attrId)?.entityId) === en.id)
                            const targetEntity = e
                            if (!sourceEntity || !targetEntity) return
                            if (sourceEntity.id === targetEntity.id) return
                            const moved = attributes.find((at) => at.id === attrId)
                            if (!moved) return
                            const sourceAttrs = attributes.filter((at) => at.entityId === sourceEntity.id)
                            const pkCount = sourceAttrs.filter((at) => at.isPrimaryKey).length
                            const wasPk = !!moved.isPrimaryKey
                            const doMove = () => {
                              const targetSiblings = attributes.filter((at) => at.entityId === targetEntity.id)
                              const nextOrder = targetSiblings.length > 0 ? Math.max(...targetSiblings.map((s) => s.order ?? 0)) + 1 : 0
                              if (onUpdateAttribute) onUpdateAttribute(moved.id, { entityId: targetEntity.id, order: nextOrder })
                              if (onToggleEntity && openEntityIds && !openEntityIds.has(targetEntity.id)) onToggleEntity(targetEntity.id)
                              onSelect({ type: "entity", id: targetEntity.id })
                              toast("Attribute moved", { action: { label: "Undo", onClick: () => onUpdateAttribute && onUpdateAttribute(moved.id, { entityId: sourceEntity.id }) } })
                              setDropTargetEntityId(null)
                            }
                            if (wasPk && pkCount === 1) {
                              toast("Moving last PK from source entity", { action: { label: "Proceed", onClick: doMove } })
                            } else {
                              doMove()
                            }
                          }}
                          onDragLeave={() => setDropTargetEntityId((prev) => (prev === e.id ? null : prev))}
                        >
                          <ul className="mt-1 list-none pl-0">
                            {attrs
                              .filter((a) => (query ? match(a.name) : true))
                              .map((a, i) => {
                                const attrSelected = selected?.type === "attribute" && selected.id === a.id
                                return (
                                  <li key={a.id}
                                      draggable
                                      onDragStart={(ev) => {
                                        // set both custom and plain formats for robustness
                                        ev.dataTransfer.setData("application/x-attr-id", a.id)
                                        ev.dataTransfer.setData("text/plain", a.id)
                                        ev.dataTransfer.effectAllowed = "move"
                                      }}
                                      className={i % 2 === 1 ? 'bg-gray-50 rounded' : ''}
                                  >
                                    <button
                                      onClick={() => onSelect({ type: "attribute", id: a.id })}
                                      className={`w-full px-2 py-1 rounded flex items-center justify-between ${attrSelected ? "bg-gray-50" : "hover:bg-gray-50"} focus:outline-none focus:ring-2 focus:ring-gray-300`}
                                      role="treeitem"
                                      aria-level={3}
                                      data-tree-item="true"
                                      tabIndex={attrSelected ? 0 : -1}
                                    >
                                      <span className="flex items-center min-w-0 gap-1">
                                        <span className="text-gray-900 text-xs truncate">{a.name}</span>
                                        <span className="flex items-center gap-1 ml-2 shrink-0">
                                          {a.isPrimaryKey && <span title="PK" className="badge badge--pk">PK</span>}
                                          {a.isForeignKey && <span title="FK" className="badge badge--fk">FK</span>}
                                          {a.isPII && <span title="PII" className="badge badge--pii">PII</span>}
                                        </span>
                                      </span>
                                      <span className="text-[10px] text-gray-400 ml-2 shrink-0">{a.dataType || "—"}</span>
                                    </button>
                                  </li>
                                )
                              })}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
    </div>
  )
}


