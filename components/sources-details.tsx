"use client"

import { useMemo, useState } from "react"
import type { SourcesDomainData, SourceObject, SourceColumnTag } from "@/lib/source-types"
import { getSourceColumnTagBadge } from "@/lib/source-types"
import { ImButton } from "./ui/im-button"
import { useSettings } from "@/lib/use-settings"

interface SourcesDetailsProps {
  data: SourcesDomainData
  selected: { type: "object" | "column" | "schema" | "database" | "system"; id: string } | null
}

const ALL_TAGS: SourceColumnTag[] = [
  "BusinessKey",
  "LinkBusinessKey",
  "ChildKey",
  "DictionaryKey",
  "DictionaryChildKey",
  "PIIAttribute"
]

export function SourcesDetails({ data, selected }: SourcesDetailsProps) {
  const settings = useSettings()
  const [tab, setTab] = useState<"overview" | "columns">("overview")
  const [localData, setLocalData] = useState<SourcesDomainData>(data)

  // Update local data when prop changes
  useMemo(() => {
    setLocalData(data)
  }, [data])

  const handleToggleTag = (columnId: string, tag: SourceColumnTag) => {
    const updatedData = { ...localData }

    for (const obj of updatedData.objects) {
      const col = obj.columns.find(c => c.id === columnId)
      if (col) {
        if (!col.tags) {
          col.tags = []
        }
        const tagIndex = col.tags.indexOf(tag)
        if (tagIndex > -1) {
          col.tags.splice(tagIndex, 1)
        } else {
          col.tags.push(tag)
        }
        break
      }
    }

    setLocalData(updatedData)

    // Persist to localStorage
    try {
      localStorage.setItem("infoMapperSourcesV1", JSON.stringify(updatedData))

      // Dispatch custom event to notify other components about the change
      window.dispatchEvent(new CustomEvent("sources-data-updated"))
    } catch (e) {
      console.error("Failed to save sources data:", e)
    }
  }

  const selectedObject: SourceObject | null = useMemo(() => {
    if (selected?.type === "object") {
      return localData.objects.find((o) => o.id === selected.id) || null
    }
    if (selected?.type === "column") {
      const obj = localData.objects.find((o) => o.columns.some((c) => c.id === selected.id))
      return obj || null
    }
    return null
  }, [selected, localData.objects])

  const fqn = useMemo(() => {
    if (!selectedObject) return "—"
    const sch = localData.schemas.find((s) => s.id === selectedObject.schemaId)
    if (!sch) return selectedObject.name
    const db = localData.databases.find((d) => d.id === sch.databaseId)
    const sys = db ? localData.systems.find((s) => s.id === db.systemId) : undefined
    const sysName = sys?.name || "?"
    const dbName = db?.name || "?"
    const schName = sch?.name || "?"
    return `${sysName}.${dbName}.${schName}.${selectedObject.name}`
  }, [selectedObject, localData])

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
                    <th className="text-left px-3 py-2 border-b">Tags</th>
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
                      <td className="px-3 py-2 border-b">
                        <div className="flex flex-wrap gap-1">
                          {ALL_TAGS.map(tag => {
                            const isSelected = c.tags?.includes(tag) || false
                            const { label, color } = getSourceColumnTagBadge(tag, settings.sourceColumnTags)
                            return (
                              <button
                                key={tag}
                                onClick={() => handleToggleTag(c.id, tag)}
                                className={`px-1.5 py-0.5 text-xs rounded border cursor-pointer transition-opacity ${
                                  isSelected ? color : 'bg-gray-50 text-gray-400 border-gray-200 opacity-50 hover:opacity-100'
                                }`}
                                title={tag}
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </td>
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





