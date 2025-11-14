"use client"

import { memo } from 'react'
import { Sidebar } from './sidebar'
import { DiagramArea } from './diagram-area'
import { DependencyPanel } from './dependency-panel'
import type {
  DiagramItem,
  Connection,
  Attribute,
  Entity,
  Source,
  Requirement,
  Concept,
  LogicalEntity,
  LogicalAttribute,
} from '@/lib/types'
import type { SourcesDomainData } from '@/lib/source-types'

// ============================
// Type Definitions
// ============================

interface MappingViewV2Props {
  // DiagramArea props
  diagramItems: DiagramItem[]
  connections: Connection[]
  positionUpdateCounter: number
  collapseCounter: number
  filterUpdateCounter: number
  editFormCounter: number
  onAddItem: (itemId: string, itemType: 'entity' | 'source' | 'requirement', left: number, top: number) => void
  onHideItem: (itemId: string) => void
  onUpdatePosition: (itemId: string, left: number, top: number) => void
  onAttributeEditStateChange: () => void
  onAddConnection: (connection: Connection) => void
  onDeleteConnection: (connectionId: string) => void
  onToggleCollapsed: (itemId: string) => void
  onUpdateObjectType: (itemId: string, objectType: string) => void
  onSetAttributeFilter: (itemId: string, filter: 'all' | 'mapped' | 'unmapped' | 'keys') => void
  onUpdateWidth: (itemId: string, width: number) => void
  onAddCustomAttribute: (itemId: string, attribute: Attribute) => void
  onUpdateAttribute: (itemId: string, attrId: string, updates: Partial<Attribute>) => void
  onDeleteAttribute: (itemId: string, attrId: string) => void

  // Sidebar props
  entityFilter: string
  sourceFilter: string
  requirementFilter: string
  onEntityFilterChange: (query: string) => void
  onSourceFilterChange: (query: string) => void
  onRequirementFilterChange: (query: string) => void
  concepts: Concept[]
  logicalEntities: LogicalEntity[]
  logicalAttributes: LogicalAttribute[]
  projectedEntities: Entity[]
  importedSources: Source[]
  requirementsForUi: Requirement[]
  sourcesRawData: SourcesDomainData
  onAddCustomEntity: (name: string, objectType?: string) => void
  onAddCustomEntityWithConcept?: (conceptId: string, name: string, objectType?: string) => void
  onAddCustomSource: (name: string, database?: string) => void
  onAddCustomRequirement: (name: string, reqType: string) => void

  // DependencyPanel props
  selectedAttribute: {
    itemId: string
    itemType: 'entity' | 'source' | 'requirement'
    attrId: string
    attrName: string
  } | null
  onSelectAttribute: (
    attr: {
      itemId: string
      itemType: 'entity' | 'source' | 'requirement'
      attrId: string
      attrName: string
    } | null
  ) => void
}

// ============================
// MappingViewV2 Component
// ============================

/**
 * MappingViewV2 component provides a complete mapping view with:
 * - Sidebar with entity/source/requirement trees
 * - DiagramArea for visual mapping
 * - DependencyPanel for viewing attribute connections
 *
 * This component integrates all three sub-components into a cohesive layout.
 */
export const MappingViewV2 = memo(function MappingViewV2(props: MappingViewV2Props) {
  const {
    // DiagramArea props
    diagramItems,
    connections,
    positionUpdateCounter,
    collapseCounter,
    filterUpdateCounter,
    editFormCounter,
    onAddItem,
    onHideItem,
    onUpdatePosition,
    onAttributeEditStateChange,
    onAddConnection,
    onDeleteConnection,
    onToggleCollapsed,
    onUpdateObjectType,
    onSetAttributeFilter,
    onUpdateWidth,
    onAddCustomAttribute,
    onUpdateAttribute,
    onDeleteAttribute,
    // Sidebar props
    entityFilter,
    sourceFilter,
    requirementFilter,
    onEntityFilterChange,
    onSourceFilterChange,
    onRequirementFilterChange,
    concepts,
    logicalEntities,
    logicalAttributes,
    projectedEntities,
    importedSources,
    requirementsForUi,
    sourcesRawData,
    onAddCustomEntity,
    onAddCustomEntityWithConcept,
    onAddCustomSource,
    onAddCustomRequirement,
    // DependencyPanel props
    selectedAttribute,
    onSelectAttribute,
  } = props

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* LEFT: Sidebar with Entity/Source/Requirement trees */}
      <Sidebar
        entityFilter={entityFilter}
        sourceFilter={sourceFilter}
        requirementFilter={requirementFilter}
        onEntityFilterChange={onEntityFilterChange}
        onSourceFilterChange={onSourceFilterChange}
        onRequirementFilterChange={onRequirementFilterChange}
        diagramItems={diagramItems}
        entities={projectedEntities}
        sources={importedSources}
        requirements={requirementsForUi}
        concepts={concepts}
        logicalEntities={logicalEntities}
        logicalAttributes={logicalAttributes}
        sourcesRawData={sourcesRawData}
        onAddCustomEntity={onAddCustomEntity}
        onAddCustomEntityWithConcept={onAddCustomEntityWithConcept}
        onAddCustomSource={onAddCustomSource}
        onAddCustomRequirement={onAddCustomRequirement}
      />

      {/* CENTER: DiagramArea */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <DiagramArea
          diagramItems={diagramItems}
          connections={connections}
          positionUpdateCounter={positionUpdateCounter}
          collapseCounter={collapseCounter}
          filterUpdateCounter={filterUpdateCounter}
          editFormCounter={editFormCounter}
          activeView="mapping"
          onAddItem={onAddItem}
          onHideItem={onHideItem}
          onUpdatePosition={onUpdatePosition}
          onAttributeEditStateChange={onAttributeEditStateChange}
          onAddConnection={onAddConnection}
          onDeleteConnection={onDeleteConnection}
          searchQuery=""
          onSelectAttribute={onSelectAttribute}
          onToggleCollapsed={onToggleCollapsed}
          onUpdateObjectType={onUpdateObjectType}
          onSetAttributeFilter={onSetAttributeFilter}
          onUpdateWidth={onUpdateWidth}
          onAddCustomAttribute={onAddCustomAttribute}
          onUpdateAttribute={onUpdateAttribute}
          onDeleteAttribute={onDeleteAttribute}
          entities={projectedEntities}
          customSources={importedSources}
          customRequirements={requirementsForUi}
        />
      </main>

      {/* BOTTOM: DependencyPanel (overlay when attribute selected) */}
      <DependencyPanel
        selectedAttribute={selectedAttribute}
        connections={connections}
        entities={projectedEntities}
        sources={importedSources}
        requirements={requirementsForUi}
        onClose={() => onSelectAttribute(null)}
        onDeleteConnection={onDeleteConnection}
      />
    </div>
  )
})
