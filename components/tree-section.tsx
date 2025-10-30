"use client"

import { useState } from "react"
import { TreeItem } from "./tree-item"
import type { Entity, Source, Requirement, DiagramItem, Concept } from "@/lib/types"
import { ImButton } from "./ui/im-button"
import { ImInput } from "./ui/im-input"
import { ImSelect } from "./ui/im-select"

interface TreeSectionProps {
  title: string
  items: Entity[] | Source[] | Requirement[]
  type: "entity" | "source" | "requirement"
  searchQuery: string
  onSearchChange: (query: string) => void
  diagramItems: DiagramItem[]
  onAddCustom: (arg1: string, arg2?: string) => void
  // Nowe: koncepty dla encji
  concepts?: Concept[]
  onAddCustomEntity?: (conceptId: string, name: string, objectType?: string) => void
  // Opcjonalnie: ukryj przycisk Add (np. dla Sources w Mapping)
  allowAdd?: boolean
}

export function TreeSection({
  title,
  items,
  type,
  searchQuery,
  onSearchChange,
  diagramItems,
  onAddCustom,
  concepts = [],
  onAddCustomEntity,
  allowAdd = true,
}: TreeSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ field1: "", field2: "", field3: "" })

  const handleAdd = () => {
    // Nowa logika dla encji - ZAWSZE 3 pola
    if (type === "entity" && onAddCustomEntity) {
      // field1 = conceptId (może być pusty → Default Concept)
      // field2 = entity name
      // field3 = object type
      const conceptId = formData.field1
      const entityName = formData.field2
      const objectType = formData.field3 || "Object"
      // Wymagaj tylko nazwy encji
      if (!entityName.trim()) return
      onAddCustomEntity(conceptId || "", entityName, objectType)
    } else {
      // Stara logika dla sources i requirements
      if (type === "requirement") {
        // field1 = Requirement Name, field2 = Requirement Type
        if (!formData.field1.trim()) return
        const name = formData.field1.trim()
        const typeValue = formData.field2 || "Functional"
        // Przekazujemy dalej nazwę i typ; ID tworzone w tle przez widok docelowy
        onAddCustom(name, typeValue)
      } else {
        if (!formData.field1.trim()) return
        onAddCustom(formData.field1, formData.field2 || undefined)
      }
    }

    setFormData({ field1: "", field2: "", field3: "" })
    setShowAddForm(false)
  }

  const getFormLabels = () => {
    switch (type) {
      case "entity":
        // ZAWSZE pokazuj 3 pola dla encji
        return {
          field1: "Concept Name",
          field2: "Entity Name", 
          field3: "Object Type",
          field1Options: concepts.length > 0 
            ? concepts.map(c => ({ value: c.id, label: c.name }))
            : [{ value: "", label: "Default Concept (will be created)" }],
          field3Options: ["Object", "Dictionary", "Link", "Context", "Informative"],
        }
      case "source":
        return { field1: "Source Name", field2: "Database" }
      case "requirement":
        return { field1: "Requirement Name", field2: "Requirement Type", field2Options: ["Functional", "Non-functional", "Other"] }
    }
  }

  const labels = getFormLabels()

  return (
    <div className="mb-4">
      <div
        className="py-2 px-3 cursor-pointer flex justify-between items-center rounded-md hover:bg-gray-100 transition-colors group"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="font-semibold text-sm text-gray-900">{title}</span>
        <div className="flex items-center gap-2">
          {allowAdd && (
            <ImButton
              variant="primary"
              onClick={(e) => {
                e.stopPropagation()
                setShowAddForm(!showAddForm)
              }}
            >
              Add
            </ImButton>
          )}
          <span className="text-xs text-gray-500 group-hover:text-gray-700">{collapsed ? "▶" : "▼"}</span>
        </div>
      </div>
      {!collapsed && (
        <div className="mt-2">
          {allowAdd && showAddForm && (
            <div className="mb-3 p-3 bg-white border border-blue-200 rounded-md shadow-sm">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{labels.field1}</label>
                  {type === "entity" && labels.field1Options ? (
                    <ImSelect
                      value={formData.field1}
                      onChange={(e) => setFormData({ ...formData, field1: e.target.value })}
                    >
                      <option value="">Select concept...</option>
                      {labels.field1Options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </ImSelect>
                  ) : (
                    <ImInput
                      type="text"
                      value={formData.field1}
                      onChange={(e) => setFormData({ ...formData, field1: e.target.value })}
                      placeholder={`Enter ${labels.field1.toLowerCase()}`}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{labels.field2}</label>
                  {labels.field2Options ? (
                    <ImSelect
                      value={formData.field2 || (type === "requirement" ? "Functional" : "Object")}
                      onChange={(e) => setFormData({ ...formData, field2: e.target.value })}
                    >
                      {type === "entity" && <option value="">Select type...</option>}
                      {labels.field2Options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </ImSelect>
                  ) : (
                    <ImInput
                      type="text"
                      value={formData.field2}
                      onChange={(e) => setFormData({ ...formData, field2: e.target.value })}
                      placeholder={`Enter ${labels.field2.toLowerCase()}`}
                    />
                  )}
                </div>
                {type === "entity" && labels.field3 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{labels.field3}</label>
                    <ImSelect
                      value={formData.field3 || "Object"}
                      onChange={(e) => setFormData({ ...formData, field3: e.target.value })}
                    >
                      {labels.field3Options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </ImSelect>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <ImButton
                    variant="primary"
                    onClick={handleAdd}
                    className="flex-1"
                  >
                    Create
                  </ImButton>
                  <ImButton
                    variant="neutral"
                    onClick={() => {
                      setShowAddForm(false)
                      setFormData({ field1: "", field2: "", field3: "" })
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </ImButton>
                </div>
              </div>
            </div>
          )}
          <div className="mb-2 px-1">
            <ImInput
              type="text"
              placeholder={`Filter ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="space-y-0.5">
            {items.map((item) => (
              <TreeItem key={item.id} item={item} type={type} searchQuery={searchQuery} diagramItems={diagramItems} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
