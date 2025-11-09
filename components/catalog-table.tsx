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
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null)

  const visibleDefs = useMemo(() => {
    const byId = new Map(columnDefs.map((d) => [d.id, d]))
    return config.visibleColumns.map((id) => byId.get(id)!).filter(Boolean)
  }, [config.visibleColumns, columnDefs])

  const toggleColumn = (id: CatalogColumnId) => {
    const set = new Set(config.visibleColumns)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onConfigChange?.({ ...config, visibleColumns: Array.from(set) as CatalogColumnId[] })
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumnIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedColumnIndex === null || draggedColumnIndex === dropIndex) {
      setDraggedColumnIndex(null)
      return
    }

    const newColumns = [...config.visibleColumns]
    const [removed] = newColumns.splice(draggedColumnIndex, 1)
    newColumns.splice(dropIndex, 0, removed)

    onConfigChange?.({ ...config, visibleColumns: newColumns })
    setDraggedColumnIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedColumnIndex(null)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b bg-white flex items-center justify-end">
        <details className="relative">
          <summary className="list-none cursor-pointer text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">Columns</summary>
          <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded shadow-lg p-2 z-50">
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

      <div className="flex-1 overflow-y-auto border-t border-gray-200 px-4 py-4" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9'
      }}>
        <table className="im-table border border-gray-200">
          <thead className="im-thead">
            <tr>
              {visibleDefs.map((def, idx) => (
                <th
                  key={def.id}
                  className="im-th cursor-move select-none hover:bg-gray-100 transition-colors"
                  style={{
                    width: def.width,
                    opacity: draggedColumnIndex === idx ? 0.5 : 1,
                    backgroundColor: draggedColumnIndex === idx ? '#e5e7eb' : undefined
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  title="Drag to reorder columns"
                >
                  {def.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={(row.attributeId || row.entityId || row.conceptId || "row") + "_" + idx}
                className={idx % 2 === 1 ? "bg-gray-50" : ""}
              >
                {visibleDefs.map((def) => {
                  const val = def.accessor(row)
                  const text = Array.isArray(val) ? val.join(", ") : typeof val === "boolean" ? (val ? "yes" : "no") : (val ?? "")
                  return (
                    <td key={def.id} className="im-td">
                      {text}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


