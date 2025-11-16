"use client"

import { useState, useEffect } from "react"
import type { Concept, DiagramItem, Entity, LogicalEntity } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { ImInput } from "@/components/ui/im-input"
import { ImButton } from "@/components/ui/im-button"
import { TreeItem } from "./tree-item"
import { getModelTreePrefs, setModelTreePrefs } from "@/lib/ui-prefs"

interface ModelObjectTreeProps {
  concepts: Concept[]
  logicalEntities: LogicalEntity[]
  entities: Entity[]
  diagramItems: DiagramItem[]
  searchQuery?: string
  onSearchChange?: (q: string) => void
  onAddCustom: (name: string, objectType?: string) => void
  isLeftPanelVisible?: boolean
  onToggleLeftPanelVisible?: (v: boolean) => void
}

export function ModelObjectTree({ concepts, logicalEntities, entities, diagramItems, searchQuery: externalSearchQuery, onSearchChange: externalOnSearchChange, onAddCustom, isLeftPanelVisible, onToggleLeftPanelVisible }: ModelObjectTreeProps) {
  // Use internal state for search if not controlled externally
  const [internalSearchQuery, setInternalSearchQuery] = useState("")
  const searchQuery = externalSearchQuery ?? internalSearchQuery
  const onSearchChange = externalOnSearchChange ?? setInternalSearchQuery
  // Build concept-to-entities map inline (no memoization to avoid reactive dependencies)
  const byConcept = (() => {
    const map = new Map<string, Entity[]>()
    for (const c of concepts) map.set(c.id, [])
    // match logical->entity by id
    for (const le of logicalEntities) {
      const ent = entities.find((e) => e.id === le.id)
      if (!ent) continue
      const list = map.get(le.conceptId) || []
      list.push(ent)
      map.set(le.conceptId, list)
    }
    return map
  })()

  // Lazy initialization with localStorage persistence - ONLY from localStorage, no fallback
  const [openConceptIds, setOpenConceptIds] = useState<Set<string>>(() => {
    const prefs = getModelTreePrefs()
    return prefs.openConceptIds
      ? new Set<string>(prefs.openConceptIds)
      : new Set<string>()  // Empty set, default will be set by useEffect if needed
  })

  const [filterHasPk, setFilterHasPk] = useState(false)
  const [filterHasPii, setFilterHasPii] = useState(false)
  const [filterOnlyIssues, setFilterOnlyIssues] = useState(false)

  // Set default expansion ONLY on true first visit (when localStorage is empty)
  useEffect(() => {
    const prefs = getModelTreePrefs()
    // Only set default if: localStorage is empty AND state is empty AND we have concepts
    if (!prefs.openConceptIds && openConceptIds.size === 0 && concepts.length > 0) {
      setOpenConceptIds(new Set([concepts[0].id]))
    }
  }, []) // Empty deps - run only once on mount

  // Persist expansion state to localStorage
  useEffect(() => {
    setModelTreePrefs({
      openConceptIds: Array.from(openConceptIds),
    })
  }, [openConceptIds])

  // Auto-expand concepts on search (like ObjectTree)
  useEffect(() => {
    if (!searchQuery) return
    const lower = searchQuery.toLowerCase()
    const matching = new Set<string>()

    // Build fresh byConcept map for search (snapshot at search time)
    const searchByConcept = new Map<string, Entity[]>()
    for (const c of concepts) searchByConcept.set(c.id, [])
    for (const le of logicalEntities) {
      const ent = entities.find((e) => e.id === le.id)
      if (!ent) continue
      const list = searchByConcept.get(le.conceptId) || []
      list.push(ent)
      searchByConcept.set(le.conceptId, list)
    }

    for (const c of concepts) {
      const ents = searchByConcept.get(c.id) || []
      const conceptMatches = c.name.toLowerCase().includes(lower)
      let entityOrAttrMatch = false
      for (const e of ents) {
        const eMatches = e.name.toLowerCase().includes(lower)
        const attrMatches = (e.attributes || []).some((a) => a.name.toLowerCase().includes(lower))
        if (eMatches || attrMatches) {
          entityOrAttrMatch = true
        }
      }
      if (conceptMatches || entityOrAttrMatch) matching.add(c.id)
    }
    if (matching.size > 0) {
      setOpenConceptIds((prev) => new Set<string>([...prev, ...matching]))
    }
  }, [searchQuery])

  const addAlphaToHex = (hex: string, alphaHex: string = "26") => {
    if (typeof hex !== "string") return hex
    const m = /^#([0-9a-fA-F]{6})$/.exec(hex)
    if (!m) return hex
    return `${hex}${alphaHex}`
  }
  

  return (
    <div>
      <div className="mb-2 px-1">
        <ImInput
          type="text"
          placeholder={"Filter object..."}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {/* Poziom 2: filtry inline */}
      <div className="mb-3 flex items-center gap-3 text-xs text-gray-700">
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

      {/* Poziom 3: buttons expand/collapse */}
      <div className="mb-3 flex items-center gap-2">
        <ImButton
          variant="primary"
          onClick={() => {
            // Expand current: heurystyka – pierwszy concept z wynikami
            const first = concepts[0]?.id
            if (!first) return
            setOpenConceptIds(new Set([first]))
          }}
        >
          Expand current only
        </ImButton>
        <button
          className="im-button im-button--primary"
          onClick={() => {
            const all = new Set<string>(concepts.map((c) => c.id))
            setOpenConceptIds(all)
          }}
        >
          Expand all
        </button>
        <ImButton
          variant="primary"
          onClick={() => setOpenConceptIds(new Set())}
        >
          Collapse all
        </ImButton>
      </div>

      <div className="space-y-1">
        {(concepts.length > 0 ? concepts : [{ id: "__no_concept__", name: "Ungrouped" }]).map((c) => {
          const byNameMatch = (e: Entity) => (searchQuery ? e.name.toLowerCase().includes(searchQuery.toLowerCase()) || (e.attributes || []).some((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase())) : true)
          const hasPk = (e: Entity) => (e.attributes || []).some((a: any) => a.isPrimaryKey)
          const hasPii = (e: Entity) => (e.attributes || []).some((a) => !!a.isPII)
          const passesFilters = (e: Entity) => (!filterHasPk || hasPk(e)) && (!filterHasPii || hasPii(e)) && (!filterOnlyIssues || !hasPk(e))

          const groupedEnts = (byConcept.get(c.id) || [])
          const ents = groupedEnts.filter((e) => byNameMatch(e) && passesFilters(e))
          // Fallback: if no concepts, show all entities
          const toRender = concepts.length > 0 ? ents : entities.filter((e) => byNameMatch(e) && passesFilters(e))
          if (toRender.length === 0 && searchQuery) return null
          return (
            <div key={c.id} className="border-b border-gray-100 pb-1">
              <div
                className="px-2 py-1 text-xs font-medium rounded cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                style={{ backgroundColor: c.color ? addAlphaToHex(c.color) as any : undefined }}
                onClick={() => {
                  setOpenConceptIds((prev) => {
                    const next = new Set(prev)
                    if (next.has(c.id)) next.delete(c.id)
                    else next.add(c.id)
                    return next
                  })
                }}
              >
                <span className="text-xs">{c.name}</span>
                <button className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors" title={openConceptIds.has(c.id) ? "Collapse" : "Expand"}>{openConceptIds.has(c.id) ? "▼" : "▶"}</button>
              </div>
              {openConceptIds.has(c.id) && (
                <div className="mt-1 space-y-0.5">
                  {toRender.map((e) => (
                    <TreeItem key={e.id} item={{ ...e, name: e.name }} type="entity" searchQuery={searchQuery} diagramItems={diagramItems} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* koniec drzewa */}
    </div>
  )
}


