"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { SourcesDomainData, SourceObject } from "@/lib/source-types"
import { SourcesTree } from "./sources-tree"
import { SourcesDetails } from "./sources-details"
import { SourcesIssues } from "./sources-issues"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { z } from "zod"
import { getSourcesTreePrefs, setSourcesTreePrefs } from "@/lib/ui-prefs"
import { ImButton } from "./ui/im-button"
import { ImInput } from "./ui/im-input"
import { sourcesFilterSchema } from "@/lib/filter/schemas"
import { IntelligentFilter } from "@/components/ui/intelligent-filter"

interface SourcesViewV2Props {
  data: SourcesDomainData
  onDataUpdated?: () => void
}

export function SourcesViewV2({ data, onDataUpdated }: SourcesViewV2Props) {
  const [selected, setSelected] = useState<{ type: "object" | "column" | "schema" | "database" | "system"; id: string } | null>(null)
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true)
  const [leftPanelWidth, setLeftPanelWidth] = useState(340)
  const [dataState, setDataState] = useState<SourcesDomainData>(data)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Filtered objects from IntelligentFilter
  const [filteredObjects, setFilteredObjects] = useState<SourcesDomainData['objects']>(dataState.objects)

  // Update filtered objects when dataState changes (e.g., after import)
  useEffect(() => {
    setFilteredObjects(dataState.objects)
  }, [dataState])

  useEffect(() => {
    const prefs = getSourcesTreePrefs()
    if (typeof prefs.leftPanelWidth === 'number') setLeftPanelWidth(prefs.leftPanelWidth)
    if (typeof prefs.isLeftPanelVisible === 'boolean') setIsLeftPanelVisible(prefs.isLeftPanelVisible)
  }, [])

  // Load persisted Sources data
  useEffect(() => {
    try {
      const raw = localStorage.getItem("infoMapperSourcesV1")
      if (raw) {
        const parsed = SourcesDomainSchema.parse(JSON.parse(raw))
        setDataState(parsed)
      }
    } catch (e) {
      console.error("Error loading Sources from localStorage:", e)
    }
  }, [])

  const objectsById = useMemo(() => {
    const map = new Map<string, SourceObject>()
    for (const o of dataState.objects) map.set(o.id, o)
    return map
  }, [dataState.objects])

  // Schema walidacji importu (MVP)
  const SourceColumnSchema = z.object({
    id: z.string(),
    objectId: z.string(),
    name: z.string(),
    dataType: z.object({
      base: z.string(),
      length: z.number().optional(),
      precision: z.number().optional(),
      scale: z.number().optional(),
    }),
    nullable: z.boolean(),
    isPrimaryKey: z.boolean().optional(),
    isForeignKey: z.boolean().optional(),
    defaultValue: z.string().optional(),
    comment: z.string().optional(),
  })

  const SourceObjectSchema = z.object({
    id: z.string(),
    schemaId: z.string(),
    name: z.string(),
    objectType: z.enum(["table", "view"]),
    columns: z.array(SourceColumnSchema),
    rowCount: z.number().optional(),
    comment: z.string().optional(),
  })

  const SourcesDomainSchema = z.object({
    systems: z.array(z.object({ id: z.string(), name: z.string() })),
    databases: z.array(z.object({ id: z.string(), systemId: z.string(), name: z.string() })),
    schemas: z.array(z.object({ id: z.string(), databaseId: z.string(), name: z.string() })),
    objects: z.array(SourceObjectSchema),
  })

  // Build hierarchical filtered data from filtered objects
  const filteredData = useMemo(() => {
    // Filter schemas, databases, systems based on filtered objects
    const usedSchemaIds = new Set(filteredObjects.map(o => o.schemaId))
    const filteredSchemas = dataState.schemas.filter(s => usedSchemaIds.has(s.id))
    
    const usedDatabaseIds = new Set(filteredSchemas.map(s => s.databaseId))
    const filteredDatabases = dataState.databases.filter(d => usedDatabaseIds.has(d.id))
    
    const usedSystemIds = new Set(filteredDatabases.map(d => d.systemId))
    const filteredSystems = dataState.systems.filter(s => usedSystemIds.has(s.id))
    
    return {
      systems: filteredSystems,
      databases: filteredDatabases,
      schemas: filteredSchemas,
      objects: filteredObjects
    }
  }, [dataState, filteredObjects])

  const handleImportClick = () => {
    setIsImportOpen(true)
  }

  const handleChooseFile = () => {
    if (!fileInputRef.current) return
    fileInputRef.current.click()
  }

  const handleFileSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const raw = JSON.parse(reader.result as string)
        console.log("Parsed JSON:", raw)
        const parsed = SourcesDomainSchema.parse(raw)
        setDataState(parsed)
        try {
          localStorage.setItem("infoMapperSourcesV1", JSON.stringify(parsed))
        } catch {}
        if (onDataUpdated) {
          onDataUpdated()
        }
        setIsImportOpen(false)
      } catch (err) {
        console.error("Full validation error:", err)
        if (err instanceof z.ZodError) {
          console.error("Zod validation errors:", JSON.stringify(err.errors, null, 2))
        }
        alert("Invalid JSON file for Sources import. Check console for details.")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-1 overflow-hidden text-sm">
      {isLeftPanelVisible ? (
        <aside className="bg-gray-50 border-r border-gray-200 p-4 flex flex-col flex-shrink-0" style={{ width: `${leftPanelWidth}px`, maxWidth: '40vw', minWidth: '220px' }}>
          <SourcesTree data={filteredData} selected={selected} onSelect={setSelected} isLeftPanelVisible={isLeftPanelVisible} onToggleLeftPanelVisible={setIsLeftPanelVisible} />
        </aside>
      ) : (
        <div
          className="w-2 bg-gray-100 hover:bg-gray-200 border-r border-gray-200 cursor-pointer"
          title="Show left panel (Alt+L)"
          onClick={() => setIsLeftPanelVisible(true)}
          aria-label="Show left panel"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsLeftPanelVisible(true) } }}
        />
      )}
      {isLeftPanelVisible && (
        <div
          className="w-1 cursor-col-resize bg-transparent hover:bg-gray-200"
          onMouseDown={(e) => {
            e.preventDefault()
            const startX = e.clientX
            const startWidth = leftPanelWidth
            const onMove = (ev: MouseEvent) => {
              const delta = ev.clientX - startX
              const newWidth = Math.min(560, Math.max(220, startWidth + delta))
              setLeftPanelWidth(newWidth)
            }
            const onUp = () => {
              window.removeEventListener('mousemove', onMove)
              window.removeEventListener('mouseup', onUp)
              setSourcesTreePrefs({ leftPanelWidth, isLeftPanelVisible })
            }
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
          }}
          title="Drag to resize"
          aria-label="Resize left panel"
        />
      )}

      <main className="flex-1 overflow-auto">
        <div className="px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Sources v2 (Experimental)</h2>
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <ImButton
                  variant="primary"
                  onClick={handleImportClick}
                >
                  Import from file
                </ImButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import from file</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <p>Wybierz plik JSON przygotowany wg schematu z dokumentu „Sources – instrukcja i szablony importu".</p>
                  <div className="flex items-center gap-2">
                    <ImButton
                      variant="primary"
                      onClick={handleChooseFile}
                    >Wybierz plik…</ImButton>
                    <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileSelected} />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Intelligent Filter */}
          <IntelligentFilter
            schema={sourcesFilterSchema}
            data={dataState.objects}
            onChange={setFilteredObjects}
            contextBuilder={(obj) => {
              const schema = dataState.schemas.find(s => s.id === obj.schemaId)
              const database = schema ? dataState.databases.find(d => d.id === schema.databaseId) : null
              const system = database ? dataState.systems.find(s => s.id === database.systemId) : null
              return { schema, database, system }
            }}
            placeholder='Search tables or use advanced: System = "HR" AND Table LIKE "emp%"'
            showExamples={true}
          />
        </div>
        <SourcesDetails data={filteredData} selected={selected} />
      </main>
      <aside className="w-[260px] overflow-y-auto">
        <SourcesIssues data={filteredData} onSelect={setSelected} />
      </aside>
    </div>
  )
}

