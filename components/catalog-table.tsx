"use client"

import { useMemo, useState } from "react"
import type { CatalogColumnDef, CatalogColumnId, CatalogConfig, CatalogRow } from "@/lib/catalog-types"

interface CatalogTableProps {
  rows: CatalogRow[]
  config: CatalogConfig
  columnDefs: CatalogColumnDef[]
  onConfigChange?: (cfg: CatalogConfig) => void
}

export function CatalogTable({ rows, config, columnDefs, onConfigChange }: CatalogTableProps) {
  const [query, setQuery] = useState("")
  const [showOnlySelected, setShowOnlySelected] = useState(false)

  const visibleDefs = useMemo(() => {
    const byId = new Map(columnDefs.map((d) => [d.id, d]))
    return config.visibleColumns.map((id) => byId.get(id)!).filter(Boolean)
  }, [config.visibleColumns, columnDefs])

  const filtered = useMemo(() => {
    const base = !query.trim()
      ? rows
      : rows.filter((r) =>
          [r.conceptName, r.entityName, r.attributeName, r.sourceSystem, r.sourceDatabase, r.sourceSchema, r.sourceObject, r.sourceColumn]
            .filter(Boolean)
            .some((v) => (v as string).toLowerCase().includes(query.toLowerCase())),
        )
    // Show only selected columns wpływa na widoczność kolumn (nie na wiersze)
    return base
  }, [rows, query, showOnlySelected])

  const toggleColumn = (id: CatalogColumnId) => {
    const set = new Set(config.visibleColumns)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onConfigChange?.({ ...config, visibleColumns: Array.from(set) as CatalogColumnId[] })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter catalog..."
            className="im-filter"
          />
          <span className="text-xs text-gray-500">Rows: {filtered.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <details className="relative">
            <summary className="list-none cursor-pointer text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">Columns</summary>
            <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded shadow p-2 z-10">
              {columnDefs.map((def) => (
                <label key={def.id} className="flex items-center gap-2 text-xs px-2 py-1 rounded hover:bg-gray-50">
                  <input type="checkbox" checked={config.visibleColumns.includes(def.id)} onChange={() => toggleColumn(def.id)} />
                  {def.title}
                </label>
              ))}
              <div className="mt-2 pt-2 border-t">
                <label className="flex items-center gap-2 text-xs px-2 py-1 rounded hover:bg-gray-50">
                  <input type="checkbox" checked={showOnlySelected} onChange={(e) => setShowOnlySelected(e.target.checked)} />
                  Show only selected columns
                </label>
              </div>
            </div>
          </details>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="im-table">
          <thead className="im-thead">
            <tr>
              {visibleDefs.map((def) => (
                <th key={def.id} className="im-th" style={{ width: def.width }}>
                  {def.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => (
              <tr key={(row.attributeId || row.entityId || row.conceptId || "row") + "_" + idx} className={idx % 2 === 1 ? "bg-gray-50" : ""}>
                {visibleDefs.map((def) => {
                  const val = def.accessor(row)
                  const text = Array.isArray(val) ? val.join(", ") : typeof val === "boolean" ? (val ? "yes" : "no") : (val ?? "")
                  return (
                    <td key={def.id} className="im-td">
                      {text}
                    </td>
                  )
                })}
                <td className="px-3 py-2 border-b text-gray-800 whitespace-nowrap">
                  <button
                    className="text-xs px-2 py-0.5 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    onClick={() => {
                      const target = row.attributeId ? { section: "object", payload: { type: "attribute", id: row.attributeId } } : row.entityId ? { section: "object", payload: { type: "entity", id: row.entityId } } : { section: "mapping", payload: {} }
                      try {
                        const evt = new CustomEvent("navigate-to-section", { detail: target })
                        window.dispatchEvent(evt)
                      } catch {}
                    }}
                  >Go to</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


