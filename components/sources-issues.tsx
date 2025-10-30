"use client"

import type { SourcesDomainData } from "@/lib/source-types"

interface SourcesIssuesProps {
  data: SourcesDomainData
  onSelect?: (node: { type: "object" | "column" | "schema" | "database" | "system"; id: string }) => void
}

export function SourcesIssues({ data, onSelect }: SourcesIssuesProps) {
  type Issue = {
    id: string
    label: string
    target: { type: "object" | "column"; id: string }
  }

  const issues: Issue[] = []

  for (const obj of data.objects) {
    const nameFreq = new Map<string, number>()
    let hasPk = false
    for (const col of obj.columns) {
      const key = (col.name || "").trim().toLowerCase()
      nameFreq.set(key, (nameFreq.get(key) || 0) + 1)
      if (col.isPrimaryKey) hasPk = true
      // Nieuzupełniony typ bazowy
      if (!col.dataType || !col.dataType.base) {
        issues.push({ id: `issue_missing_type_${col.id}`, label: `Missing data type for column ${col.name} in ${obj.name}`, target: { type: "column", id: col.id } })
      }
      // Wymagane parametry dla numeric/varchar
      const base = (col.dataType?.base || "").toLowerCase()
      if (base === "numeric" || base === "decimal") {
        if (col.dataType.precision == null) issues.push({ id: `issue_missing_precision_${col.id}`, label: `Missing precision for ${obj.name}.${col.name}`, target: { type: "column", id: col.id } })
        if (col.dataType.scale == null) issues.push({ id: `issue_missing_scale_${col.id}`, label: `Missing scale for ${obj.name}.${col.name}`, target: { type: "column", id: col.id } })
      }
      if (base === "varchar" || base === "char") {
        if (col.dataType.length == null) issues.push({ id: `issue_missing_length_${col.id}`, label: `Missing length for ${obj.name}.${col.name}`, target: { type: "column", id: col.id } })
      }
    }
    // Duplikaty kolumn
    for (const [key, count] of nameFreq.entries()) {
      if (key && count > 1) {
        issues.push({ id: `issue_dup_cols_${obj.id}_${key}`, label: `Duplicate column name in ${obj.name}: ${key}`, target: { type: "object", id: obj.id } })
      }
    }
    // Brak PK na tabeli (nie dotyczy widoków)
    if (obj.objectType === "table" && !hasPk) {
      issues.push({ id: `issue_no_pk_${obj.id}`, label: `Table has no primary key: ${obj.name}`, target: { type: "object", id: obj.id } })
    }
  }

  const total = issues.length

  return (
    <div className="h-full p-4 border-l border-gray-200 bg-gray-50">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-800">Sources – Validation</h4>
        <p className="text-xs text-gray-500">Kliknij, aby przejść do elementu</p>
      </div>
      <div className="text-xs text-gray-600 mb-2">Issues: <span className="font-medium text-gray-800">{total}</span></div>
      {total === 0 ? (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">Brak problemów</div>
      ) : (
        <ul className="text-sm text-gray-800 space-y-1">
          {issues.map((iss) => (
            <li key={iss.id}>
              <button
                className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                onClick={() => onSelect && onSelect(iss.target)}
              >
                {iss.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}













