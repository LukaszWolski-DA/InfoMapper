"use client"

import { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import type { CatalogColumnDef, CatalogConfig, CatalogRow } from "@/lib/catalog-types"
import { CatalogTable } from "./catalog-table"
import { buildCatalogRows } from "@/lib/catalog-builder"
import { getObjectState, subscribe } from "@/lib/store"
import { IntelligentFilter } from "@/components/ui/intelligent-filter"
import { catalogFilterSchema } from "@/lib/filter/schemas"

export function CatalogView() {
  // Load initial config from localStorage or use defaults
  const [config, setConfig] = useState<CatalogConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('infoMapperCatalogConfig')
        if (stored) {
          return JSON.parse(stored)
        }
      } catch {}
    }
    return {
      id: "default",
      title: "Coverage",
      leftSide: "attribute",
      visibleColumns: ["concept", "entity", "attribute", "mapped", "sourceDatabase", "sourceObject", "sourceColumn"],
      filters: { mappedStatus: "all" }
    }
  })

  const [state, setState] = useState<{ concepts: any[]; entities: any[]; attributes: any[]; connections: any[] }>({ concepts: [], entities: [], attributes: [], connections: [] })
  const [sourcesDomain, setSourcesDomain] = useState<any | null>(null)
  const [filteredRows, setFilteredRows] = useState<CatalogRow[]>([])
  const [hasUserFilter, setHasUserFilter] = useState(false)

  const SourcesDomainSchema = z.object({ systems: z.array(z.object({ id: z.string(), name: z.string() })), databases: z.array(z.object({ id: z.string(), systemId: z.string(), name: z.string() })), schemas: z.array(z.object({ id: z.string(), databaseId: z.string(), name: z.string() })), objects: z.array(z.object({ id: z.string(), schemaId: z.string(), name: z.string(), columns: z.array(z.object({ id: z.string(), name: z.string(), dataType: z.object({ base: z.string().optional(), length: z.number().optional(), precision: z.number().optional(), scale: z.number().optional() }).optional() })) })) })

  // Save config to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('infoMapperCatalogConfig', JSON.stringify(config))
    } catch {}
  }, [config])

  useEffect(() => {
    // Initial load from store
    const objectState = getObjectState()
    setState({ 
      concepts: objectState.concepts, 
      entities: objectState.logicalEntities, 
      attributes: objectState.logicalAttributes, 
      connections: objectState.connections 
    })

    // Load sources domain from localStorage (it's still stored separately)
    try {
      const rawS = localStorage.getItem("infoMapperSourcesV1")
      if (rawS) setSourcesDomain(SourcesDomainSchema.parse(JSON.parse(rawS)))
    } catch {}

    // Subscribe to store updates
    const unsubscribe = subscribe(() => {
      const newState = getObjectState()
      setState({ 
        concepts: newState.concepts, 
        entities: newState.logicalEntities, 
        attributes: newState.logicalAttributes, 
        connections: newState.connections 
      })
    })
    
    return unsubscribe
  }, [])

  const rows = useMemo(() => buildCatalogRows({ config, concepts: state.concepts, entities: state.entities, attributes: state.attributes, connections: state.connections, sourcesDomain: sourcesDomain || undefined }), [config, state, sourcesDomain])

  // Handle filter changes - only show results when user has applied a filter
  const handleFilterChange = (filtered: CatalogRow[], query?: string) => {
    // Only mark as "user has filtered" if query is not empty
    // This prevents showing all data on initial mount
    if (query && query.trim()) {
      setHasUserFilter(true)
      setFilteredRows(filtered)
    } else {
      setHasUserFilter(false)
      setFilteredRows([])
    }
  }

  const columnDefs: CatalogColumnDef[] = useMemo(() => [
    // Logical Model - Concept
    { id: "concept", title: "Concept", width: 160, accessor: (r) => r.conceptName },

    // Logical Model - Entity
    { id: "entity", title: "Entity", width: 180, accessor: (r) => r.entityName },
    { id: "entityStereotype", title: "Entity Stereotype", width: 140, accessor: (r) => r.entityStereotype },
    { id: "entityDescription", title: "Entity Description", width: 200, accessor: (r) => r.entityDescription },
    { id: "entityTags", title: "Entity Tags", width: 150, accessor: (r) => r.entityTags },

    // Logical Model - Attribute
    { id: "attribute", title: "Attribute", width: 200, accessor: (r) => r.attributeName },
    { id: "attributeDataType", title: "Attr Type", width: 120, accessor: (r) => r.attributeDataType },
    { id: "attributeIsPrimaryKey", title: "Attr PK", width: 80, accessor: (r) => !!r.attributeIsPrimaryKey },
    { id: "attributeIsForeignKey", title: "Attr FK", width: 80, accessor: (r) => !!r.attributeIsForeignKey },
    { id: "attributeIsNullable", title: "Attr Nullable", width: 100, accessor: (r) => !!r.attributeIsNullable },
    { id: "attributeIsPII", title: "Attr PII", width: 80, accessor: (r) => !!r.attributeIsPII },
    { id: "attributeDescription", title: "Attr Description", width: 200, accessor: (r) => r.attributeDescription },
    { id: "attributeOrder", title: "Attr Order", width: 100, accessor: (r) => r.attributeOrder },

    // Source System Hierarchy
    { id: "sourceSystem", title: "Source System", width: 140, accessor: (r) => r.sourceSystem },
    { id: "sourceDatabase", title: "Source DB", width: 140, accessor: (r) => r.sourceDatabase },
    { id: "sourceSchema", title: "Schema", width: 120, accessor: (r) => r.sourceSchema },
    { id: "sourceObject", title: "Object", width: 180, accessor: (r) => r.sourceObject },

    // Source Column
    { id: "sourceColumn", title: "Column", width: 180, accessor: (r) => r.sourceColumn },
    { id: "sourceDataType", title: "Source Type", width: 140, accessor: (r) => r.sourceDataType },
    { id: "sourceNullable", title: "Source Nullable", width: 120, accessor: (r) => !!r.sourceNullable },
    { id: "sourceIsPrimaryKey", title: "Source PK", width: 100, accessor: (r) => !!r.sourceIsPrimaryKey },
    { id: "sourceIsForeignKey", title: "Source FK", width: 100, accessor: (r) => !!r.sourceIsForeignKey },
    { id: "sourceDefaultValue", title: "Source Default", width: 140, accessor: (r) => r.sourceDefaultValue },
    { id: "sourceComment", title: "Source Comment", width: 200, accessor: (r) => r.sourceComment },
    { id: "sourceTags", title: "Source Tags", width: 150, accessor: (r) => r.sourceTags },

    // Mapping & Coverage
    { id: "mapped", title: "Mapped", width: 80, accessor: (r) => !!r.mapped },
    { id: "requirementIds", title: "Requirements", width: 150, accessor: (r) => r.requirementIds },
    { id: "relationshipHint", title: "Relationship", width: 150, accessor: (r) => r.relationshipHint },

    // Legacy
    { id: "isPII", title: "PII (Legacy)", width: 100, accessor: (r) => !!r.isPII },
  ], [])

  // Display rows only if user has applied a filter
  const displayRows = hasUserFilter ? filteredRows : []

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="px-4 py-3 border-b bg-white flex-shrink-0">
        <div className="mb-2">
          <IntelligentFilter
            schema={catalogFilterSchema}
            data={rows}
            onChange={handleFilterChange}
            placeholder='Search catalog: Concept = "Customer" OR Mapped = "no"'
            showExamples={false}
          />
        </div>
        <div className="flex items-center gap-2">
          {hasUserFilter ? (
            <span className="text-xs text-gray-600">
              Filtered: <span className="font-medium">{filteredRows.length}</span> / {rows.length} rows
            </span>
          ) : (
            <span className="text-xs text-gray-500 italic">
              Enter a filter to view results ({rows.length} total rows available)
            </span>
          )}
        </div>
      </div>
      <CatalogTable rows={displayRows} config={config} columnDefs={columnDefs} onConfigChange={setConfig} />
    </div>
  )
}



