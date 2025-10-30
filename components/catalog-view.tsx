"use client"

import { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import type { CatalogColumnDef, CatalogColumnId, CatalogConfig } from "@/lib/catalog-types"
import { CatalogTable } from "./catalog-table"
import { ImSelect } from "@/components/ui/im-select"
import { buildCatalogRows } from "@/lib/catalog-builder"
import { getObjectState, subscribe } from "@/lib/store"

export function CatalogView() {
  const [config, setConfig] = useState<CatalogConfig>({ id: "default", title: "Coverage", leftSide: "attribute", visibleColumns: ["concept", "entity", "attribute", "mapped", "sourceDatabase", "sourceObject", "sourceColumn"], filters: { mappedStatus: "all" } })

  const [state, setState] = useState<{ concepts: any[]; entities: any[]; attributes: any[]; connections: any[] }>({ concepts: [], entities: [], attributes: [], connections: [] })
  const [sourcesDomain, setSourcesDomain] = useState<any | null>(null)

  // Schematy do wczytania istniejącego stanu
  const DiagramItemSchema = z.object({ itemId: z.string(), itemType: z.enum(["entity", "source", "requirement"]) })
  const ConnectionEndpointSchema = z.object({ attrId: z.string(), parentType: z.string(), itemId: z.string() })
  const ConnectionSchema = z.object({ id: z.string(), type: z.enum(["attribute-mapping", "requirement-mapping"]), source: ConnectionEndpointSchema, target: ConnectionEndpointSchema })
  const ConceptSchema = z.object({ id: z.string(), name: z.string() })
  const LogicalEntitySchema = z.object({ id: z.string(), conceptId: z.string(), name: z.string() })
  const LogicalAttributeSchema = z.object({ id: z.string(), entityId: z.string(), name: z.string(), dataType: z.string().optional(), isPII: z.boolean().optional() })
  const PersistedStateSchema = z.object({ concepts: z.array(ConceptSchema).default([]), logicalEntities: z.array(LogicalEntitySchema).default([]), logicalAttributes: z.array(LogicalAttributeSchema).default([]), connections: z.array(ConnectionSchema).default([]) })

  const SourcesDomainSchema = z.object({ systems: z.array(z.object({ id: z.string(), name: z.string() })), databases: z.array(z.object({ id: z.string(), systemId: z.string(), name: z.string() })), schemas: z.array(z.object({ id: z.string(), databaseId: z.string(), name: z.string() })), objects: z.array(z.object({ id: z.string(), schemaId: z.string(), name: z.string(), columns: z.array(z.object({ id: z.string(), name: z.string(), dataType: z.object({ base: z.string().optional(), length: z.number().optional(), precision: z.number().optional(), scale: z.number().optional() }).optional() })) })) })

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

  const columnDefs: CatalogColumnDef[] = useMemo(() => [
    { id: "concept", title: "Concept", width: 160, accessor: (r) => r.conceptName },
    { id: "entity", title: "Entity", width: 180, accessor: (r) => r.entityName },
    { id: "attribute", title: "Attribute", width: 200, accessor: (r) => r.attributeName },
    { id: "attributeDataType", title: "Attr Type", width: 120, accessor: (r) => r.attributeDataType },
    { id: "isPII", title: "PII", width: 60, accessor: (r) => !!r.isPII },
    { id: "mapped", title: "Mapped", width: 80, accessor: (r) => !!r.mapped },
    { id: "sourceSystem", title: "Source System", width: 140, accessor: (r) => r.sourceSystem },
    { id: "sourceDatabase", title: "Source DB", width: 140, accessor: (r) => r.sourceDatabase },
    { id: "sourceSchema", title: "Schema", width: 120, accessor: (r) => r.sourceSchema },
    { id: "sourceObject", title: "Object", width: 180, accessor: (r) => r.sourceObject },
    { id: "sourceColumn", title: "Column", width: 180, accessor: (r) => r.sourceColumn },
    { id: "sourceDataType", title: "Source Type", width: 140, accessor: (r) => r.sourceDataType },
  ], [])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b bg-white flex items-center gap-3">
        <div className="text-sm text-gray-700">Filters:</div>
        <ImSelect
          value={config.filters?.mappedStatus || "all"}
          onChange={(e) => setConfig({ ...config, filters: { ...(config.filters || {}), mappedStatus: e.target.value as any } })}
        >
          <option value="all">All</option>
          <option value="mapped">Mapped</option>
          <option value="unmapped">Unmapped</option>
        </ImSelect>
        <ImSelect
          value={(config.filters?.conceptIds && config.filters.conceptIds[0]) || ""}
          onChange={(e) => {
            const val = e.target.value
            const nextFilters = { ...(config.filters || {}) }
            nextFilters.conceptIds = val ? [val] : []
            // reset entity filter if concept changed
            nextFilters.entityIds = []
            setConfig({ ...config, filters: nextFilters })
          }}
        >
          <option value="">All concepts</option>
          {state.concepts.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </ImSelect>
        <ImSelect
          value={(config.filters?.entityIds && config.filters.entityIds[0]) || ""}
          onChange={(e) => {
            const val = e.target.value
            const nextFilters = { ...(config.filters || {}) }
            nextFilters.entityIds = val ? [val] : []
            setConfig({ ...config, filters: nextFilters })
          }}
        >
          <option value="">All entities</option>
          {state.entities
            .filter((en: any) => {
              const selConcept = (config.filters?.conceptIds && config.filters.conceptIds[0]) || ""
              return selConcept ? en.conceptId === selConcept : true
            })
            .map((en: any) => (
              <option key={en.id} value={en.id}>{en.name}</option>
            ))}
        </ImSelect>
      </div>
      <CatalogTable rows={rows} config={config} columnDefs={columnDefs} onConfigChange={setConfig} />
    </div>
  )
}



