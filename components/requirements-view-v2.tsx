"use client"

import { useEffect, useState, useMemo } from "react"
import { addRequirement, deleteRequirement, updateRequirement } from "@/lib/commands"
import { getObjectState, subscribe } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImInput } from "@/components/ui/im-input"
import { ImSelect } from "@/components/ui/im-select"
import { ImButton } from "@/components/ui/im-button"
import { IntelligentFilter } from "@/components/ui/intelligent-filter"
import { requirementsFilterSchema, objectFilterSchema } from "@/lib/filter/schemas"
import type { Connection, LogicalAttribute, LogicalEntity, Concept } from "@/lib/types"
import MDEditor from '@uiw/react-md-editor'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface RequirementRow {
  id: string
  name: string
  description?: string
  type?: "Functional" | "Non-functional" | "Other"
  displayId: number
}

interface RequirementsViewV2Props {
  connections?: Connection[]
  logicalAttributes?: LogicalAttribute[]
  logicalEntities?: LogicalEntity[]
  concepts?: Concept[]
}

export function RequirementsViewV2({
  connections = [],
  logicalAttributes = [],
  logicalEntities = [],
  concepts = []
}: RequirementsViewV2Props) {
  const [items, setItems] = useState<RequirementRow[]>(getObjectState().requirements as any)
  
  // Step 1: Filter by requirements criteria
  const [filteredByRequirements, setFilteredByRequirements] = useState<RequirementRow[]>(items)
  
  // Step 2: Filter by entity/attribute criteria
  const [filteredByEntity, setFilteredByEntity] = useState<LogicalAttribute[]>(logicalAttributes)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formType, setFormType] = useState<"Functional" | "Non-functional" | "Other">("Functional")
  const [viewDescId, setViewDescId] = useState<string | null>(null)
  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(true)
  const [isEntityFilterVisible, setIsEntityFilterVisible] = useState(false) // Domyślnie ukryty

  // Helper: Get requirement IDs that are mapped to filtered entities/attributes
  const requirementsMappedToEntities = useMemo(() => {
    // If entity filter is hidden or no entity filter applied (all attributes visible), don't filter by entity
    if (!isEntityFilterVisible || filteredByEntity.length === logicalAttributes.length) {
      return new Set<string>(items.map(r => r.id)) // All requirements
    }
    
    // Wyciągnij unikalne encje z przefiltrowanych atrybutów
    const filteredEntityIds = new Set(
      filteredByEntity.map(a => a.entityId)
    )
    
    const reqIds = new Set<string>()
    
    // 🔍 DEBUG: Log connections info
    console.log('=== REQUIREMENTS FILTER DEBUG ===')
    console.log('isEntityFilterVisible:', isEntityFilterVisible)
    console.log('filteredByEntity length:', filteredByEntity.length)
    console.log('filteredByEntity:', filteredByEntity)
    console.log('filteredEntityIds:', Array.from(filteredEntityIds))
    
    const reqMappingConnections = connections.filter(c => c.type === "requirement-mapping")
    console.log('Requirement-mapping connections:', reqMappingConnections)
    
    // Find "New Entity" ID
    const newEntity = logicalEntities.find(e => e.name === "New Entity")
    console.log('New Entity:', newEntity)
    if (newEntity) {
      const newEntityAttrs = logicalAttributes.filter(a => a.entityId === newEntity.id)
      console.log('New Entity attributes:', newEntityAttrs)
      const connectionsToNewEntity = reqMappingConnections.filter(c => 
        c.target.itemId === newEntity.id || 
        newEntityAttrs.some(attr => attr.id === c.target.attrId)
      )
      console.log('Connections to New Entity:', connectionsToNewEntity)
    }
    
    connections
      .filter(c => c.type === "requirement-mapping")
      .forEach(c => {
        // Req → Encja bezpośrednio (bez atrybutu)
        if (c.target.attrId === "" && filteredEntityIds.has(c.target.itemId)) {
          console.log('✓ Matched (entity-level):', c)
          reqIds.add(c.source.itemId)
        }
        
        // Req → Atrybut
        // Sprawdź czy atrybut należy do przefiltrowanej encji (entity-level matching)
        if (c.target.attrId !== "") {
          const attr = logicalAttributes.find(a => a.id === c.target.attrId)
          if (attr && filteredEntityIds.has(attr.entityId)) {
            console.log('✓ Matched (attribute-level):', c, 'attr:', attr)
            reqIds.add(c.source.itemId)
          } else {
            console.log('✗ Not matched:', c, 'attr:', attr)
          }
        }
      })
    
    console.log('Final matched reqIds:', Array.from(reqIds))
    console.log('=== END DEBUG ===')
    
    return reqIds
  }, [isEntityFilterVisible, filteredByEntity, logicalAttributes, logicalEntities, connections, items])

  // Final filtered list: intersection of both filters
  const filteredItems = useMemo(() => {
    return filteredByRequirements.filter(req => requirementsMappedToEntities.has(req.id))
  }, [filteredByRequirements, requirementsMappedToEntities])

  // Subskrybuj store
  useEffect(() => {
    const unsub = subscribe(() => {
      const reqs = (getObjectState().requirements as any) || []
      setItems(reqs)
      setFilteredByRequirements(reqs)
    })
    return () => unsub()
  }, [])
  
  // Update filteredByEntity when logicalAttributes change
  useEffect(() => {
    setFilteredByEntity(logicalAttributes)
  }, [logicalAttributes])

  const openCreate = () => {
    setEditingId(null)
    setFormName("")
    setFormDesc("")
    setFormType("Functional")
    setIsFormOpen(true)
  }

  const openEdit = (row: RequirementRow) => {
    setEditingId(row.id)
    setFormName(row.name)
    setFormDesc(row.description || "")
    setFormType(row.type || "Functional")
    setIsFormOpen(true)
  }

  const saveForm = () => {
    const name = formName.trim()
    if (!name) return
    if (editingId) {
      updateRequirement(editingId, { name, description: formDesc, type: formType })
    } else {
      addRequirement(name, formType, formDesc)
    }
    setIsFormOpen(false)
  }

  const removeRequirement = (id: string) => {
    deleteRequirement(id)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* IntelligentFilter Section - fixed header */}
      {isFilterPanelVisible ? (
        <div className="px-4 py-3 border-b border-gray-200 bg-white shrink-0">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-900">Requirements</h2>
              <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!isFilterPanelVisible}
                  onChange={(e) => setIsFilterPanelVisible(!e.target.checked)}
                  className="rounded"
                />
                Hide Panel
              </label>
            </div>
            
            {/* Requirements Filter */}
            <div className="space-y-1 mb-3">
              <h3 className="text-xs font-semibold text-gray-700">Requirements Filter</h3>
              <IntelligentFilter
                schema={requirementsFilterSchema}
                data={items}
                onChange={setFilteredByRequirements}
                placeholder='Search requirements: RequirementType = "Functional" OR REQ_ID = 123456'
                showExamples={false}
              />
            </div>
            
            {/* Entity/Attribute Filter - collapsible */}
            {isEntityFilterVisible ? (
              <div className="space-y-1 border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-semibold text-gray-700">Entity/Attribute Filter (mapped to)</h3>
                  <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!isEntityFilterVisible}
                      onChange={(e) => setIsEntityFilterVisible(!e.target.checked)}
                      className="rounded"
                    />
                    Hide Panel
                  </label>
                </div>
                <IntelligentFilter
                  schema={objectFilterSchema}
                  data={logicalAttributes}
                  onChange={(filtered) => {
                    console.log('🔍 IntelligentFilter onChange:', filtered)
                    setFilteredByEntity(filtered)
                  }}
                  placeholder='Filter by entity: Entity = "User" OR Attribute LIKE "%password%"'
                  showExamples={false}
                  contextBuilder={(attr) => {
                    const entity = logicalEntities.find(e => e.id === attr.entityId)
                    const concept = entity ? concepts.find(c => c.id === entity.conceptId) : undefined
                    const context = `${concept?.name || ""} ${entity?.name || ""} ${attr.name || ""} ${attr.description || ""} ${attr.dataType || ""}`
                    console.log('🔍 Context for attr:', attr.name, '→', context)
                    return context
                  }}
                  contextData={(attr) => {
                    const entity = logicalEntities.find(e => e.id === attr.entityId)
                    const concept = entity ? concepts.find(c => c.id === entity.conceptId) : undefined
                    return { entity, concept }
                  }}
                />
              </div>
            ) : (
              <div
                className="h-7 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded cursor-pointer flex items-center justify-center"
                title="Show Entity/Attribute filter"
                onClick={() => setIsEntityFilterVisible(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsEntityFilterVisible(true) } }}
              >
                <span className="text-xs text-gray-600">▼ Show Entity/Attribute Filter</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">
                Filtered: <span className="font-medium">{filteredItems.length}</span> / {items.length} requirements
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ImButton variant="primary" onClick={openCreate}>Add Requirement</ImButton>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="h-8 bg-gray-100 hover:bg-gray-200 border-b border-gray-200 cursor-pointer flex items-center justify-center shrink-0"
          title="Show filter panel"
          onClick={() => setIsFilterPanelVisible(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsFilterPanelVisible(true) } }}
        >
          <span className="text-xs text-gray-600">▼ Show Filter Panel</span>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Requirement" : "Add Requirement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Requirement Name</div>
              <ImInput value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Requirement Description (Markdown supported)</div>
              <MDEditor
                value={formDesc}
                onChange={(val) => setFormDesc(val || "")}
                preview="edit"
                height={250}
                data-color-mode="light"
              />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Requirement Type</div>
              <ImSelect value={formType} onChange={(e) => setFormType(e.target.value as any)}>
                <option value="Functional">Functional</option>
                <option value="Non-functional">Non-functional</option>
                <option value="Other">Other</option>
              </ImSelect>
            </div>
            <div className="flex gap-2 pt-2">
              <ImButton onClick={saveForm} variant="success">Save</ImButton>
              <ImButton onClick={() => setIsFormOpen(false)} variant="neutral">Cancel</ImButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table area - scrollable */}
      <div className="flex-1 overflow-auto p-4">
        <table className="im-table border border-gray-200">
          <thead className="im-thead">
            <tr>
              <th className="im-th">REQ_ID</th>
              <th className="im-th">Requirement Name</th>
              <th className="im-th">Requirement Description</th>
              <th className="im-th">Requirement Type</th>
              <th className="im-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((r, idx) => (
              <tr
                key={r.id}
                className={idx % 2 === 1 ? "bg-gray-50" : ""}
                draggable
                onDragStart={(e) => {
                  const target = e.target as HTMLElement
                  if (target.closest("button") || target.closest("a") || target.closest("[role='button']")) {
                    e.preventDefault()
                    return
                  }
                  e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({ type: "requirement", itemId: r.id, itemType: "requirement", name: r.name }),
                  )
                  e.dataTransfer.effectAllowed = "copyMove"
                }}
              >
                <td className="im-td font-mono text-gray-700">{r.displayId}</td>
                <td className="im-td text-gray-900">{r.name}</td>
                <td className="im-td text-gray-700">
                  <Dialog open={viewDescId === r.id} onOpenChange={(o) => setViewDescId(o ? r.id : null)}>
                    <button
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                      onClick={() => setViewDescId(r.id)}
                    >
                      View
                    </button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Requirement Description</DialogTitle>
                      </DialogHeader>
                      <div className="text-sm text-gray-700 prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {r.description || "(no description)"}
                        </ReactMarkdown>
                      </div>
                    </DialogContent>
                  </Dialog>
                </td>
                <td className="im-td">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs ${r.type === "Functional" ? "bg-blue-100 text-blue-700" : r.type === "Non-functional" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}
                  >
                    {r.type || "Functional"}
                  </span>
                </td>
                <td className="im-td">
                  <div className="flex gap-1 justify-end">
                    <ImButton variant="neutral" onClick={() => openEdit(r)}>Edit</ImButton>
                    <ImButton
                      variant="danger"
                      onClick={() => {
                        if (confirm(`Remove requirement "${r.name}"?`)) {
                          removeRequirement(r.id)
                        }
                      }}
                    >
                      Remove
                    </ImButton>
                  </div>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={5} className="im-td text-center text-gray-500">
                  {items.length === 0 ? "No requirements yet. Click 'Add Requirement' to create one." : "No requirements match the filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

