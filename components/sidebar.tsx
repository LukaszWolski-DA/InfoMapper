"use client"

import { useState, useEffect } from "react"
import { TreeSection } from "./tree-section"
import { ObjectTree } from "./object-tree"
import { SourcesTree } from "./sources-tree"
import { ImButton } from "./ui/im-button"
import { ImInput } from "./ui/im-input"
import { ImSelect } from "./ui/im-select"
import type { DiagramItem, Entity, Source, Requirement, Concept, LogicalEntity, LogicalAttribute } from "@/lib/types"
import type { SourcesDomainData } from "@/lib/source-types"

interface SidebarProps {
  entityFilter: string
  sourceFilter: string
  requirementFilter: string
  onEntityFilterChange: (query: string) => void
  onSourceFilterChange: (query: string) => void
  onRequirementFilterChange: (query: string) => void
  diagramItems: DiagramItem[]
  // Dane do wyświetlenia (pełna lista). Jeśli nie podane, można użyć zapasowych list custom*
  entities?: Entity[]
  sources?: Source[]
  requirements?: Requirement[]
  customEntities?: Entity[]
  customSources?: Source[]
  customRequirements?: Requirement[]
  // Nowe: koncepty dla encji i pełne dane do ObjectTree
  concepts?: Concept[]
  logicalEntities?: LogicalEntity[]
  logicalAttributes?: LogicalAttribute[]
  // Nowe: pełne dane sources z hierarchią systemów (jeśli dostępne)
  sourcesRawData?: SourcesDomainData
  onAddCustomEntity: (name: string, objectType?: string) => void
  onAddCustomEntityWithConcept?: (conceptId: string, name: string, objectType?: string) => void
  onAddCustomSource: (name: string, database?: string) => void
  onAddCustomRequirement: (name: string, reqType: string) => void
}

export function Sidebar({
  entityFilter,
  sourceFilter,
  requirementFilter,
  onEntityFilterChange,
  onSourceFilterChange,
  onRequirementFilterChange,
  diagramItems,
  entities,
  sources,
  requirements,
  customEntities = [],
  customSources = [],
  customRequirements = [],
  concepts = [],
  logicalEntities = [],
  logicalAttributes = [],
  sourcesRawData,
  onAddCustomEntity,
  onAddCustomEntityWithConcept,
  onAddCustomSource,
  onAddCustomRequirement,
}: SidebarProps) {
  const allEntities = entities ?? customEntities
  const allSources = sources ?? customSources
  const allRequirements = requirements ?? customRequirements

  // State for sidebar width with resizing
  const [sidebarWidth, setSidebarWidth] = useState(340)

  // State for ObjectTree expand/collapse
  const [openConceptIds, setOpenConceptIds] = useState<Set<string>>(new Set())
  const [openEntityIds, setOpenEntityIds] = useState<Set<string>>(new Set())

  // State for Add forms
  const [showAddEntity, setShowAddEntity] = useState(false)
  const [newEntityName, setNewEntityName] = useState("")
  const [newEntityType, setNewEntityType] = useState("Object")
  const [newEntityConcept, setNewEntityConcept] = useState("")

  const handleToggleConcept = (id: string) => {
    setOpenConceptIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleEntity = (id: string) => {
    setOpenEntityIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Transform Source[] to SourcesDomainData for SourcesTree
  const transformSourcesToDomain = (sources: Source[]): SourcesDomainData => {
    // Safety check - if no sources, return empty structure
    if (!sources || sources.length === 0) {
      return {
        systems: [],
        databases: [],
        schemas: [],
        objects: []
      }
    }

    const objects = sources.map(s => ({
      id: s.id,
      schemaId: `schema_${s.database || 'unknown'}_${s.schema || 'unknown'}`,
      name: s.table,
      objectType: 'table' as const,
      columns: (s.attributes || []).map(a => ({
        id: a.id,
        objectId: s.id,
        name: a.name,
        dataType: { base: a.dataType || 'String' },
        nullable: true,
        isPrimaryKey: a.isPrimaryKey,
        isForeignKey: a.isForeignKey,
      }))
    }))
    
    const schemasMap = new Map<string, { database: string; schema: string }>()
    sources.forEach(s => {
      const key = `${s.database || 'unknown'}_${s.schema || 'unknown'}`
      if (!schemasMap.has(key)) {
        schemasMap.set(key, { database: s.database || 'unknown', schema: s.schema || 'unknown' })
      }
    })
    
    const schemas = Array.from(schemasMap.entries()).map(([key, { database, schema }]) => ({
      id: `schema_${key}`,
      databaseId: `db_${database}`,
      name: schema
    }))
    
    const databasesSet = new Set(sources.map(s => s.database || 'unknown'))
    const databases = Array.from(databasesSet).map(name => ({
      id: `db_${name}`,
      systemId: 'sys_default',
      name
    }))
    
    const systems = [{
      id: 'sys_default',
      name: 'Imported Sources'
    }]
    
    return { systems, databases, schemas, objects }
  }

  // Use sourcesRawData if available, otherwise transform from legacy sources
  const sourcesData = sourcesRawData && sourcesRawData.systems.length > 0 
    ? sourcesRawData 
    : transformSourcesToDomain(allSources || [])

  const handleAddEntity = () => {
    if (!newEntityName.trim()) return
    
    if (newEntityConcept && onAddCustomEntityWithConcept) {
      // Jeśli wybrano koncept, użyj funkcji z konceptem
      onAddCustomEntityWithConcept(newEntityConcept, newEntityName, newEntityType)
    } else {
      // Inaczej dodaj bez konceptu (do domyślnego)
      onAddCustomEntity(newEntityName, newEntityType)
    }
    
    setNewEntityName("")
    setNewEntityType("Object")
    setNewEntityConcept("")
    setShowAddEntity(false)
  }

  return (
    <>
      <aside 
        className="bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto" 
        style={{ width: `${sidebarWidth}px`, maxWidth: '40vw', minWidth: '280px' }}
      >
        {/* Object Section */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-sm text-gray-900">Object</span>
            <ImButton
              variant="primary"
              size="sm"
              onClick={() => setShowAddEntity(!showAddEntity)}
            >
              {showAddEntity ? "Cancel" : "Add"}
            </ImButton>
          </div>
          
          {showAddEntity && (
            <div className="mb-3 p-3 bg-white border border-gray-200 rounded space-y-2">
              <div>
                <label className="block text-xs text-gray-700 mb-1">Concept (optional)</label>
                <ImSelect
                  value={newEntityConcept}
                  onChange={(e) => setNewEntityConcept(e.target.value)}
                >
                  <option value="">-- Default Concept --</option>
                  {concepts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </ImSelect>
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Entity Name</label>
                <ImInput
                  type="text"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  placeholder="Enter entity name"
                  onKeyDown={(e) => e.key === "Enter" && handleAddEntity()}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Object Type</label>
                <ImSelect
                  value={newEntityType}
                  onChange={(e) => setNewEntityType(e.target.value)}
                >
                  <option value="Object">Object</option>
                  <option value="Link">Link</option>
                  <option value="Dictionary">Dictionary</option>
                  <option value="Context">Context</option>
                  <option value="Informative">Informative</option>
                </ImSelect>
              </div>
              <ImButton
                variant="primary"
                size="sm"
                onClick={handleAddEntity}
                className="w-full"
              >
                Create
              </ImButton>
            </div>
          )}

          <ObjectTree
            concepts={concepts || []}
            entities={logicalEntities || []}
            attributes={logicalAttributes || []}
            selected={null}
            onSelect={() => {}} // No-op for Mapping
            openConceptIds={openConceptIds}
            openEntityIds={openEntityIds}
            onToggleConcept={handleToggleConcept}
            onToggleEntity={handleToggleEntity}
            query={entityFilter}
            setQuery={onEntityFilterChange}
            filterHasPk={false}
            setFilterHasPk={() => {}}
            filterHasPii={false}
            setFilterHasPii={() => {}}
            filterOnlyIssues={false}
            setFilterOnlyIssues={() => {}}
            isLeftPanelVisible={true}
          />
        </div>

        {/* Sources Section */}
        <div className="mb-4">
          <div className="mb-2">
            <span className="font-semibold text-sm text-gray-900">Sources</span>
          </div>

          <SourcesTree
            data={sourcesData}
            selected={null}
            onSelect={() => {}} // No-op for Mapping
            query={sourceFilter}
            setQuery={onSourceFilterChange}
            isLeftPanelVisible={true}
          />
        </div>

        {/* Requirements Section */}
      <TreeSection
        title="Requirements"
        items={allRequirements}
        type="requirement"
        searchQuery={requirementFilter}
        onSearchChange={onRequirementFilterChange}
        diagramItems={diagramItems}
          onAddCustom={(name: string, reqType?: string) => onAddCustomRequirement(name, reqType || "Functional")}
        />
      </aside>

      {/* Resizer */}
      <div
        className="w-1 cursor-col-resize bg-transparent hover:bg-gray-300"
        onMouseDown={(e) => {
          e.preventDefault()
          const startX = e.clientX
          const startWidth = sidebarWidth
          const onMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX
            const newWidth = Math.min(600, Math.max(280, startWidth + delta))
            setSidebarWidth(newWidth)
          }
          const onUp = () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
          }
          window.addEventListener('mousemove', onMove)
          window.addEventListener('mouseup', onUp)
        }}
        title="Drag to resize sidebar"
        aria-label="Resize sidebar"
      />
    </>
  )
}
