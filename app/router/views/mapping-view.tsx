"use client"

import { useCallback } from 'react'
import { MappingViewV2 } from '@/components/mapping-view-v2'
import { useMappingState } from './hooks/use-mapping-state'
import { useMappingActions } from './hooks/use-mapping-actions'
import type {
  Concept,
  LogicalEntity,
  LogicalAttribute,
  Entity,
  Source,
  Requirement,
} from '@/lib/types'
import type { SourcesDomainData } from '@/lib/source-types'

// ============================
// Type Definitions
// ============================

interface MappingViewProps {
  // UI callbacks
  onAttributeEditStateChange: () => void

  // Domain data
  concepts: Concept[]
  logicalEntities: LogicalEntity[]
  logicalAttributes: LogicalAttribute[]
  projectedEntities: Entity[]
  importedSources: Source[]
  requirementsForUi: Requirement[]
  sourcesRawData: SourcesDomainData

  // CRUD callbacks
  onAddCustomEntity: (name: string, objectType?: string) => void
  onAddCustomEntityWithConcept?: (conceptId: string, name: string, objectType?: string) => void
  onAddCustomSource: (name: string, database?: string) => void
  onAddCustomRequirement: (name: string, reqType: string) => void

  // Item updates
  onUpdateObjectType: (itemId: string, objectType: string) => void
}

// ============================
// MappingView Component
// ============================

/**
 * Mapping View wrapper component.
 *
 * This component uses the mapping hooks to manage diagram state and actions,
 * then passes everything to the MappingViewV2 presentation component.
 *
 * Architecture:
 * - useMappingState() - Manages diagram items, connections, filters, and selected attribute
 * - useMappingActions() - Provides all diagram manipulation actions
 * - MappingViewV2 - Renders the UI (Sidebar + DiagramArea + DependencyPanel)
 *
 * ConnectionLine components automatically react to state changes through diagramItems,
 * eliminating the need for manual counter-based synchronization.
 */
export function MappingView(props: MappingViewProps) {
  // Get state from the mapping state hook
  const state = useMappingState()

  // Get actions from the mapping actions hook
  const actions = useMappingActions()

  // Create a wrapped callback for attribute edit state changes
  const handleAttributeEditStateChange = useCallback(() => {
    // Call the original callback from props (for compatibility)
    props.onAttributeEditStateChange()
  }, [props])

  // Combine everything and pass to the presentation component
  return (
    <MappingViewV2
      // State from hook
      diagramItems={state.diagramItems}
      connections={state.connections}
      entityFilter={state.entityFilter}
      sourceFilter={state.sourceFilter}
      requirementFilter={state.requirementFilter}
      selectedAttribute={state.selectedAttribute}

      // State setters from hook
      onEntityFilterChange={state.setEntityFilter}
      onSourceFilterChange={state.setSourceFilter}
      onRequirementFilterChange={state.setRequirementFilter}
      onSelectAttribute={state.setSelectedAttribute}

      // Actions from hook
      onAddItem={actions.addDiagramItem}
      onHideItem={actions.hideDiagramItem}
      onUpdatePosition={actions.updatePosition}
      onUpdateWidth={actions.updateWidth}
      onToggleCollapsed={actions.toggleCollapsed}
      onSetAttributeFilter={actions.setAttributeFilter}
      onAddConnection={actions.addConnection}
      onDeleteConnection={actions.deleteConnection}
      onAddCustomAttribute={actions.addCustomAttribute}
      onUpdateAttribute={actions.updateAttribute}
      onDeleteAttribute={actions.deleteAttribute}
      onUpdateHandles={actions.updateHandles}

      // Props from parent
      onAttributeEditStateChange={handleAttributeEditStateChange}
      concepts={props.concepts}
      logicalEntities={props.logicalEntities}
      logicalAttributes={props.logicalAttributes}
      projectedEntities={props.projectedEntities}
      importedSources={props.importedSources}
      requirementsForUi={props.requirementsForUi}
      sourcesRawData={props.sourcesRawData}
      onAddCustomEntity={props.onAddCustomEntity}
      onAddCustomEntityWithConcept={props.onAddCustomEntityWithConcept}
      onAddCustomSource={props.onAddCustomSource}
      onAddCustomRequirement={props.onAddCustomRequirement}
      onUpdateObjectType={props.onUpdateObjectType}
    />
  )
}
