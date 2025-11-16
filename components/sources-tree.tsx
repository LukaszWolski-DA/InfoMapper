"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ImInput } from "@/components/ui/im-input"
import type { SourcesDomainData } from "@/lib/source-types"
import { getSourcesTreePrefs, setSourcesTreePrefs } from "@/lib/ui-prefs"
import { ImButton } from "./ui/im-button"

interface SourcesTreeProps {
  data: SourcesDomainData
  selected?: { type: "object" | "column" | "schema" | "database" | "system"; id: string } | null
  onSelect: (node: { type: "object" | "column" | "schema" | "database" | "system"; id: string }) => void
  isLeftPanelVisible?: boolean
  onToggleLeftPanelVisible?: (visible: boolean) => void
  // Optional controlled props for read-only mode (Mapping sidebar)
  query?: string
  setQuery?: (value: string) => void
}

export function SourcesTree({ 
  data, selected, onSelect, isLeftPanelVisible, onToggleLeftPanelVisible,
  query: controlledQuery, setQuery: controlledSetQuery
}: SourcesTreeProps) {
  const [internalQuery, internalSetQuery] = useState("")
  const query = controlledQuery ?? internalQuery
  const setQuery = controlledSetQuery ?? internalSetQuery
  const [filterOnlyTables, setFilterOnlyTables] = useState(false)
  const [filterOnlyViews, setFilterOnlyViews] = useState(false)
  const [filterOnlyIssues, setFilterOnlyIssues] = useState(false)

  // Lazy initialization with localStorage persistence (matching Object tree pattern)
  const [openSystemIds, setOpenSystemIds] = useState<Set<string>>(() => {
    const prefs = getSourcesTreePrefs()
    if (prefs.openSystemIds) {
      return new Set<string>(prefs.openSystemIds)
    }
    // Default: open first system if available
    return new Set<string>(data.systems[0] ? [data.systems[0].id] : [])
  })
  const [openDatabaseIds, setOpenDatabaseIds] = useState<Set<string>>(() => {
    const prefs = getSourcesTreePrefs()
    return new Set<string>(prefs.openDatabaseIds || [])
  })
  const [openSchemaIds, setOpenSchemaIds] = useState<Set<string>>(() => {
    const prefs = getSourcesTreePrefs()
    return new Set<string>(prefs.openSchemaIds || [])
  })
  const [openObjectIds, setOpenObjectIds] = useState<Set<string>>(() => {
    const prefs = getSourcesTreePrefs()
    return new Set<string>(prefs.openObjectIds || [])
  })

  useEffect(() => {
    setSourcesTreePrefs({
      openSystemIds: Array.from(openSystemIds),
      openDatabaseIds: Array.from(openDatabaseIds),
      openSchemaIds: Array.from(openSchemaIds),
      openObjectIds: Array.from(openObjectIds),
    })
  }, [openSystemIds, openDatabaseIds, openSchemaIds, openObjectIds])

  const idMaps = useMemo(() => {
    const dbBySystem: Record<string, string[]> = {}
    const schByDb: Record<string, string[]> = {}
    const objBySch: Record<string, string[]> = {}
    for (const d of data.databases) {
      if (!dbBySystem[d.systemId]) dbBySystem[d.systemId] = []
      dbBySystem[d.systemId].push(d.id)
    }
    for (const s of data.schemas) {
      if (!schByDb[s.databaseId]) schByDb[s.databaseId] = []
      schByDb[s.databaseId].push(s.id)
    }
    for (const o of data.objects) {
      if (!objBySch[o.schemaId]) objBySch[o.schemaId] = []
      objBySch[o.schemaId].push(o.id)
    }
    return { dbBySystem, schByDb, objBySch }
  }, [data])

  const match = (text: string) => text.toLowerCase().includes(query.toLowerCase())

  return (
    <div className="flex flex-col">
      <div className="mb-3 space-y-2">
        <div className="flex items-center gap-2" role="search">
          <ImInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search systems/databases/schemas/objects/columns"
            aria-label="Search in sources tree"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-700">
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={filterOnlyTables} onChange={(e) => setFilterOnlyTables(e.target.checked)} /> Only tables
          </label>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={filterOnlyViews} onChange={(e) => setFilterOnlyViews(e.target.checked)} /> Only views
          </label>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={filterOnlyIssues} onChange={(e) => setFilterOnlyIssues(e.target.checked)} /> Only issues
          </label>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={!isLeftPanelVisible ? true : false} onChange={(e) => onToggleLeftPanelVisible && onToggleLeftPanelVisible(!e.target.checked)} /> Hide panel
          </label>
        </div>
        <div className="flex items-center gap-2">
          <ImButton variant="primary" title="Expand all"
            onClick={() => {
              setOpenSystemIds(new Set(data.systems.map(s => s.id)))
              setOpenDatabaseIds(new Set(data.databases.map(d => d.id)))
              setOpenSchemaIds(new Set(data.schemas.map(s => s.id)))
              setOpenObjectIds(new Set(data.objects.map(o => o.id)))
            }}>Expand all</ImButton>
          <ImButton variant="primary" title="Collapse all"
            onClick={() => {
              setOpenSystemIds(new Set())
              setOpenDatabaseIds(new Set())
              setOpenSchemaIds(new Set())
              setOpenObjectIds(new Set())
            }}>Collapse all</ImButton>
        </div>
      </div>

      <div className="space-y-1">
        <ul className="space-y-1">
          {data.systems.map((sys) => {
            const openSys = openSystemIds.has(sys.id)
            const dbIds = idMaps.dbBySystem[sys.id] || []
            const showSys = query === "" || match(sys.name)
            if (!showSys && dbIds.length === 0) return null
            return (
              <li key={sys.id}>
                <div className={`py-1 pr-2 rounded flex items-center justify-between ${selected?.type === 'system' && selected.id === sys.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                  <button className="text-xs text-gray-500 px-2 py-0.5 rounded hover:bg-gray-100" onClick={() => setOpenSystemIds(prev => new Set(prev.has(sys.id) ? Array.from(prev).filter(x=>x!==sys.id) : [...Array.from(prev), sys.id]))}>{openSys ? "▼" : "▶"}</button>
                  <button className="flex-1 text-left flex items-center justify-between gap-2 min-w-0" onClick={() => onSelect({ type: 'system', id: sys.id })}>
                    <span className="text-gray-900 font-semibold text-xs truncate" title={sys.name}>{sys.name}</span>
                    <span className="text-[10px] text-gray-500 shrink-0">Source System</span>
                  </button>
                </div>
                {openSys && (
                  <ul className="ml-4 mt-1 space-y-1">
                    {dbIds.map((dbId) => {
                      const db = data.databases.find((d) => d.id === dbId)
                      if (!db) return null
                      const schIds = idMaps.schByDb[db.id] || []
                      const openDb = openDatabaseIds.has(db.id)
                      const showDb = query === "" || match(db.name)
                      if (!showDb && schIds.length === 0) return null
                      return (
                        <li key={db.id}>
                          <div className={`px-2 py-1 rounded flex items-center justify-between ${selected?.type === 'database' && selected.id === db.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                            <button className="text-xs text-gray-500 px-2 py-0.5 rounded hover:bg-gray-100" onClick={() => setOpenDatabaseIds(prev => new Set(prev.has(db.id) ? Array.from(prev).filter(x=>x!==db.id) : [...Array.from(prev), db.id]))}>{openDb ? "▼" : "▶"}</button>
                            <button className="flex-1 text-left flex items-center justify-between gap-2 min-w-0" onClick={() => onSelect({ type: 'database', id: db.id })}>
                              <span className="text-gray-900 font-semibold text-xs truncate" title={db.name}>{db.name}</span>
                              <span className="text-[10px] text-gray-500 shrink-0">Database</span>
                            </button>
                          </div>
                          {openDb && (
                            <ul className="ml-4 mt-1 space-y-1">
                              {schIds.map((schId) => {
                                const sch = data.schemas.find((s) => s.id === schId)
                                if (!sch) return null
                                const objIds = idMaps.objBySch[sch.id] || []
                                const openSch = openSchemaIds.has(sch.id)
                                const showSch = query === "" || match(sch.name)
                                if (!showSch && objIds.length === 0) return null
                                return (
                                  <li key={sch.id}>
                                    <div className={`px-2 py-1 rounded flex items-center justify-between ${selected?.type === 'schema' && selected.id === sch.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                                      <button className="text-xs text-gray-500 px-2 py-0.5 rounded hover:bg-gray-100" onClick={() => setOpenSchemaIds(prev => new Set(prev.has(sch.id) ? Array.from(prev).filter(x=>x!==sch.id) : [...Array.from(prev), sch.id]))}>{openSch ? "▼" : "▶"}</button>
                                      <button className="flex-1 text-left flex items-center justify-between gap-2 min-w-0" onClick={() => onSelect({ type: 'schema', id: sch.id })}>
                                        <span className="text-gray-900 font-semibold text-xs truncate" title={sch.name}>{sch.name}</span>
                                        <span className="text-[10px] text-gray-500 shrink-0">Schema</span>
                                      </button>
                                    </div>
                                    {openSch && (
                                      <ul className="ml-4 mt-1 space-y-1">
                                        {objIds.map((objId) => {
                                          const obj = data.objects.find((o) => o.id === objId)
                                          if (!obj) return null
                                          if (filterOnlyTables && obj.objectType !== 'table') return null
                                          if (filterOnlyViews && obj.objectType !== 'view') return null
                                          const openObj = openObjectIds.has(obj.id)
                                          const showObj = query === "" || match(obj.name) || obj.columns.some(c => match(c.name))
                                          if (!showObj) return null
                                          return (
                                            <li key={obj.id}>
                                              <div className={`px-2 py-1 rounded flex items-center justify-between ${selected?.type === 'object' && selected.id === obj.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                                                <button className="text-xs text-gray-500 px-2 py-0.5 rounded hover:bg-gray-100" onClick={() => setOpenObjectIds(prev => new Set(prev.has(obj.id) ? Array.from(prev).filter(x=>x!==obj.id) : [...Array.from(prev), obj.id]))}>{openObj ? "▼" : "▶"}</button>
                                                <button 
                                                  className="flex-1 text-left flex items-center justify-between gap-2 min-w-0 cursor-move" 
                                                  onClick={() => onSelect({ type: 'object', id: obj.id })}
                                                  draggable
                                                  onDragStart={(ev) => {
                                                    ev.stopPropagation()
                                                    ev.dataTransfer.setData('application/json', JSON.stringify({
                                                      itemId: obj.id,
                                                      itemType: 'source'
                                                    }))
                                                    ev.dataTransfer.effectAllowed = 'move'
                                                  }}
                                                >
                                                  <span className="text-gray-900 font-semibold text-xs truncate" title={obj.name}>{obj.name}</span>
                                                  <span className="ml-2 text-[11px] text-gray-500 shrink-0">{obj.objectType === 'view' ? 'View' : 'Table'}</span>
                                                </button>
                                              </div>
                                              {openObj && (
                                                <ul className="ml-8 mt-1 space-y-0.5">
                                                  {obj.columns
                                                    .filter(c => query ? match(c.name) : true)
                                                    .map((col, idx) => (
                                                      <li key={col.id} className={idx % 2 === 1 ? 'bg-gray-50 rounded' : ''}>
                                                        <button 
                                                          className={`w-full px-2 py-1 rounded flex items-center justify-between cursor-move ${selected?.type === 'column' && selected.id === col.id ? 'bg-gray-50' : 'hover:bg-gray-50'}`} 
                                                          onClick={() => onSelect({ type: 'column', id: col.id })}
                                                          draggable
                                                          onDragStart={(ev) => {
                                                            ev.stopPropagation()
                                                            ev.dataTransfer.setData('application/json', JSON.stringify({
                                                              type: 'attribute',
                                                              attrId: col.id,
                                                              attrName: col.name,
                                                              parentId: obj.id,
                                                              parentType: 'source'
                                                            }))
                                                            ev.dataTransfer.effectAllowed = 'move'
                                                          }}
                                                        >
                                                          <span className="text-gray-900 text-xs truncate">{col.name}</span>
                                                          <span className="text-[10px] text-gray-400 ml-2 shrink-0">
                                                            {col.dataType.base}{col.dataType.length ? `(${col.dataType.length})` : (col.dataType.precision != null ? `(${col.dataType.precision}${col.dataType.scale != null ? "," + col.dataType.scale : ""})` : "")}
                                                          </span>
                                                        </button>
                                                      </li>
                                                    ))}
                                                </ul>
                                              )}
                                            </li>
                                          )
                                        })}
                                      </ul>
                                    )}
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}


