"use client"

import type { Concept, LogicalAttribute, LogicalEntity } from "@/lib/types"

interface ObjectIssuesProps {
  concepts: Concept[]
  entities: LogicalEntity[]
  attributes: LogicalAttribute[]
  onSelect?: (node: { type: "concept" | "entity" | "attribute"; id: string }) => void
}

export function ObjectIssues({ concepts, entities, attributes, onSelect }: ObjectIssuesProps) {
  type Issue = {
    id: string
    type: "entity-no-pk" | "entity-duplicate-name" | "attr-duplicate-name"
    label: string
    target: { type: "entity" | "attribute" | "concept"; id: string }
    hint?: string
  }

  const issues: Issue[] = []

  // 1) Duplikaty nazw encji w obrębie konceptu
  const conceptIdToEntities: Record<string, LogicalEntity[]> = {}
  for (const c of concepts) conceptIdToEntities[c.id] = []
  for (const e of entities) {
    if (!conceptIdToEntities[e.conceptId]) conceptIdToEntities[e.conceptId] = []
    conceptIdToEntities[e.conceptId].push(e)
  }
  for (const conceptId of Object.keys(conceptIdToEntities)) {
    const ents = conceptIdToEntities[conceptId]
    const freq = new Map<string, LogicalEntity[]>()
    for (const e of ents) {
      const key = (e.name || "").trim().toLowerCase()
      if (!freq.has(key)) freq.set(key, [])
      freq.get(key)!.push(e)
    }
    for (const [key, list] of freq.entries()) {
      if (!key) continue
      if (list.length > 1) {
        for (const dup of list) {
          issues.push({
            id: `issue_ent_dup_${dup.id}`,
            type: "entity-duplicate-name",
            label: `Duplicate entity name in concept: "${dup.name}"`,
            target: { type: "entity", id: dup.id },
            hint: concepts.find((c) => c.id === conceptId)?.name,
          })
        }
      }
    }
  }

  // 2) Brak PK w encji + duplikaty nazw atrybutów w obrębie encji
  const entityIdToAttributes: Record<string, LogicalAttribute[]> = {}
  for (const a of attributes) {
    if (!entityIdToAttributes[a.entityId]) entityIdToAttributes[a.entityId] = []
    entityIdToAttributes[a.entityId].push(a)
  }
  for (const e of entities) {
    const attrs = entityIdToAttributes[e.id] || []
    const hasPk = attrs.some((a) => !!a.isPrimaryKey)
    if (!hasPk) {
      issues.push({
        id: `issue_ent_nopk_${e.id}`,
        type: "entity-no-pk",
        label: `Entity has no primary key: ${e.name}`,
        target: { type: "entity", id: e.id },
      })
    }
    const afreq = new Map<string, LogicalAttribute[]>()
    for (const a of attrs) {
      const key = (a.name || "").trim().toLowerCase()
      if (!afreq.has(key)) afreq.set(key, [])
      afreq.get(key)!.push(a)
    }
    for (const [key, list] of afreq.entries()) {
      if (!key) continue
      if (list.length > 1) {
        for (const dup of list) {
          issues.push({
            id: `issue_attr_dup_${dup.id}`,
            type: "attr-duplicate-name",
            label: `Duplicate attribute in "${e.name}": ${dup.name}`,
            target: { type: "attribute", id: dup.id },
          })
        }
      }
    }
  }

  const total = issues.length

  return (
    <div className="h-full p-4 border-l border-gray-200 bg-gray-50">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-800">Validation</h4>
        <p className="text-xs text-gray-500">Kliknij, aby przejść do problematycznego elementu</p>
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
                title={iss.hint ? `Concept: ${iss.hint}` : undefined}
              >
                <span className="inline-block min-w-[110px] text-[11px] text-gray-500 align-top">
                  {iss.type === "entity-no-pk" ? "Entity" : iss.type === "entity-duplicate-name" ? "Entity" : "Attribute"}
                </span>
                <span className="align-top">{iss.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


