"use client"

import type { Connection, Entity, Source, Requirement } from "@/lib/types"

interface DependencyPanelProps {
  selectedAttribute: {
    itemId: string
    itemType: "entity" | "source" | "requirement"
    attrId: string
    attrName: string
  } | null
  connections: Connection[]
  entities: Entity[]
  sources: Source[]
  requirements: Requirement[]
  onClose: () => void
  onDeleteConnection: (connectionId: string) => void
}

export function DependencyPanel({ selectedAttribute, connections, entities, sources, requirements, onClose, onDeleteConnection }: DependencyPanelProps) {
  if (!selectedAttribute) return null

  const data =
    selectedAttribute.itemType === "entity"
      ? entities.find((e) => e.id === selectedAttribute.itemId)
      : selectedAttribute.itemType === "source"
        ? sources.find((s) => s.id === selectedAttribute.itemId)
        : requirements.find((r) => r.id === selectedAttribute.itemId)

  const itemName = data ? ("name" in data ? data.name : "table" in data ? data.table : data.name) : ""

  // Find connections where this attribute is the source (Maps To)
  const mapsTo = connections.filter(
    (conn) => conn.source.itemId === selectedAttribute.itemId && conn.source.attrId === selectedAttribute.attrId,
  )

  // Find connections where this attribute is the target (Maps From)
  const mapsFrom = connections.filter(
    (conn) => conn.target.itemId === selectedAttribute.itemId && conn.target.attrId === selectedAttribute.attrId,
  )

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black shadow-lg transition-transform duration-300 z-50 ${
        selectedAttribute ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ height: "300px" }}
    >
      <div className="p-4 h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Attribute Dependencies</h3>
          <button onClick={onClose} className="text-2xl hover:text-red-600 transition-colors">
            ×
          </button>
        </div>

        <div className="mb-4">
          <strong>Selected:</strong> {itemName}.{selectedAttribute.attrName}
        </div>

        <div className="mb-4">
          <strong>Maps To:</strong>
          {mapsTo.length === 0 ? (
            <div className="text-gray-500 ml-4">None</div>
          ) : (
            <ul className="ml-4 list-disc space-y-1">
              {mapsTo.map((conn) => {
                const targetData =
                  conn.target.parentType === "entity"
                    ? entities.find((e) => e.id === conn.target.parentId)
                    : conn.target.parentType === "source"
                      ? sources.find((s) => s.id === conn.target.parentId)
                      : requirements.find((r) => r.id === conn.target.parentId)

                const targetName = targetData
                  ? "name" in targetData
                    ? targetData.name
                    : "table" in targetData
                      ? targetData.table
                      : targetData.name
                  : ""

                return (
                  <li key={conn.id} className="flex items-center justify-between">
                    <span>
                      {targetName}.{conn.target.attrName}
                    </span>
                    <button
                      onClick={() => onDeleteConnection(conn.id)}
                      className="ml-2 px-2 py-1 text-xs text-red-600 hover:bg-red-50 border border-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div>
          <strong>Maps From:</strong>
          {mapsFrom.length === 0 ? (
            <div className="text-gray-500 ml-4">None</div>
          ) : (
            <ul className="ml-4 list-disc space-y-1">
              {mapsFrom.map((conn) => {
                const sourceData =
                  conn.source.parentType === "entity"
                    ? entities.find((e) => e.id === conn.source.parentId)
                    : conn.source.parentType === "source"
                      ? sources.find((s) => s.id === conn.source.parentId)
                      : requirements.find((r) => r.id === conn.source.parentId)

                const sourceName = sourceData
                  ? "name" in sourceData
                    ? sourceData.name
                    : "table" in sourceData
                      ? sourceData.table
                      : sourceData.name
                  : ""

                return (
                  <li key={conn.id} className="flex items-center justify-between">
                    <span>
                      {sourceName}.{conn.source.attrName}
                    </span>
                    <button
                      onClick={() => onDeleteConnection(conn.id)}
                      className="ml-2 px-2 py-1 text-xs text-red-600 hover:bg-red-50 border border-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
