"use client"

import { useMemo, useState } from "react"
import type { SourcesDomainData, SourceObject } from "@/lib/source-types"
import { ImButton } from "./ui/im-button"

interface SourcesDetailsProps {
  data: SourcesDomainData
  selected: { type: "object" | "column" | "schema" | "database" | "system"; id: string } | null
}

export function SourcesDetails({ data, selected }: SourcesDetailsProps) {
  const [tab, setTab] = useState<"overview" | "columns">("overview")

  const selectedObject: SourceObject | null = useMemo(() => {
    if (selected?.type === "object") {
      return data.objects.find((o) => o.id === selected.id) || null
    }
    if (selected?.type === "column") {
      const obj = data.objects.find((o) => o.columns.some((c) => c.id === selected.id))
      return obj || null
    }
    return null
  }, [selected, data.objects])

  const fqn = useMemo(() => {
    if (!selectedObject) return "—"
    const sch = data.schemas.find((s) => s.id === selectedObject.schemaId)
    if (!sch) return selectedObject.name
    const db = data.databases.find((d) => d.id === sch.databaseId)
    const sys = db ? data.systems.find((s) => s.id === db.systemId) : undefined
    const sysName = sys?.name || "?"
    const dbName = db?.name || "?"
    const schName = sch?.name || "?"
    return `${sysName}.${dbName}.${schName}.${selectedObject.name}`
  }, [selectedObject, data])

  if (!selected) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium mb-1">No selection</div>
          <div className="text-sm">Wybierz system/bazę/schemat/obiekt/kolumnę z lewego panelu</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {selectedObject ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{selectedObject.name}</h3>
              <div className="text-xs text-gray-600">{fqn}</div>
            </div>
            <div className="inline-flex items-center gap-2">
              <ImButton variant="primary" onClick={() => setTab("overview")}>Overview</ImButton>
              <ImButton variant="primary" onClick={() => setTab("columns")}>Columns</ImButton>
            </div>
          </div>

          {tab === "overview" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">Type</div>
                <div className="text-gray-900">{selectedObject.objectType}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Row count</div>
                <div className="text-gray-900">{selectedObject.rowCount ?? "—"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-500">Comment</div>
                <div className="text-gray-900 whitespace-pre-wrap">{selectedObject.comment || "—"}</div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-2 text-xs text-gray-600">Columns: {selectedObject.columns.length}</div>
              <table className="w-full border border-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 border-b">No.</th>
                    <th className="text-left px-3 py-2 border-b">Name</th>
                    <th className="text-left px-3 py-2 border-b">Data Type</th>
                    <th className="text-left px-3 py-2 border-b">Nullable</th>
                    <th className="text-left px-3 py-2 border-b">PK</th>
                    <th className="text-left px-3 py-2 border-b">FK</th>
                    <th className="text-left px-3 py-2 border-b">Default</th>
                    <th className="text-left px-3 py-2 border-b">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedObject.columns.map((c, idx) => (
                    <tr key={c.id} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="px-3 py-2 border-b text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2 border-b">{c.name}</td>
                      <td className="px-3 py-2 border-b text-gray-700">
                        {c.dataType.base}{c.dataType.length ? `(${c.dataType.length})` : (c.dataType.precision != null ? `(${c.dataType.precision}${c.dataType.scale != null ? "," + c.dataType.scale : ""})` : "")}
                      </td>
                      <td className="px-3 py-2 border-b">{c.nullable ? "yes" : "no"}</td>
                      <td className="px-3 py-2 border-b">{c.isPrimaryKey ? "PK" : ""}</td>
                      <td className="px-3 py-2 border-b">{c.isForeignKey ? "FK" : ""}</td>
                      <td className="px-3 py-2 border-b">{c.defaultValue ?? ""}</td>
                      <td className="px-3 py-2 border-b">{c.comment ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="text-gray-500">Wybierz obiekt, aby zobaczyć szczegóły</div>
      )}
    </div>
  )
}





