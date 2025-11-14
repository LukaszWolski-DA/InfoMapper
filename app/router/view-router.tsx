import { memo } from 'react'
import { MappingViewV2 } from '@/components/mapping-view-v2'
import { ModelViewV2 } from '@/components/model-view-v2'
import { ObjectViewV2 } from '@/components/object-view-v2'
import { SourcesViewV2 } from '@/components/sources-view-v2'
import { RequirementsViewV2 } from '@/components/requirements-view-v2'
import { CatalogView } from '@/components/catalog-view'
import { InstructionsView } from '@/components/instructions-view'
import { SettingsView } from '@/components/settings-view'
import type {
  DiagramItem,
  Connection,
  Attribute,
  Entity,
  Source,
  Requirement,
  Relationship,
  Concept,
  LogicalEntity,
  LogicalAttribute,
} from '@/lib/types'
import type { SourcesDomainData } from '@/lib/source-types'

// ============================
// Type Definitions
// ============================

/**
 * Available view types in the application.
 * Each view type corresponds to a different main content area.
 */
export type ViewType =
  | 'mapping'
  | 'model'
  | 'object'
  | 'sources'
  | 'requirements'
  | 'catalog'
  | 'instructions'
  | 'settings'

interface ViewRouterProps {
  activeView: ViewType

  // Common state
  concepts: Concept[]
  logicalEntities: LogicalEntity[]
  logicalAttributes: LogicalAttribute[]
  projectedEntities: Entity[]

  // Sources view
  sourcesRawData: SourcesDomainData
  handleSourcesDataUpdated: () => void

  // Object view handlers
  createConcept: (name?: string) => Concept
  updateConcept: (id: string, updates: Partial<Concept>) => void
  deleteConcept: (id: string) => void
  createLogicalEntity: (conceptId: string, name?: string) => LogicalEntity
  updateLogicalEntity: (id: string, updates: Partial<LogicalEntity>) => void
  deleteLogicalEntity: (id: string) => void
  createLogicalAttribute: (entityId: string, name?: string) => LogicalAttribute
  restoreLogicalAttribute: (attr: LogicalAttribute) => void
  updateLogicalAttribute: (id: string, updates: Partial<LogicalAttribute>) => void
  deleteLogicalAttribute: (id: string) => void

  // Model view
  modelDiagramItems: DiagramItem[]
  modelRelationships: Relationship[]
  addCustomEntity: (name: string, objectType?: string) => void
  addModelItem: (item: DiagramItem) => void
  hideModelItem: (itemId: string) => void
  updateModelItemPosition: (itemId: string, left: number, top: number) => void
  updateModelItemObjectType: (itemId: string, objectType: string) => void
  updateModelItemWidth: (itemId: string, width: number) => void
  addModelRelationship: (relationship: Relationship) => void
  deleteModelRelationship: (relationshipId: string) => void
  updateModelRelationship: (relationshipId: string, updates: any) => void
  toggleModelItemCollapsed: (itemId: string) => void
  setModelAttributeFilter: (itemId: string, filter: 'all' | 'mapped' | 'unmapped' | 'keys') => void
  addModelCustomAttribute: (itemId: string, attribute: Attribute) => void
  updateModelAttribute: (itemId: string, attrId: string, updates: Partial<Attribute>) => void
  deleteModelAttribute: (itemId: string, attrId: string) => void

  // Requirements view
  connections: Connection[]

  // Mapping view
  diagramItems: DiagramItem[]
  positionUpdateCounter: number
  collapseCounter: number
  filterUpdateCounter: number
  editFormCounter: number
  selectedAttribute: {
    itemId: string
    itemType: 'entity' | 'source' | 'requirement'
    attrId: string
    attrName: string
  } | null
  importedSources: Source[]
  requirementsForUi: Requirement[]
  addItemToDiagram: (itemId: string, itemType: 'entity' | 'source' | 'requirement', left: number, top: number) => void
  hideItem: (itemId: string) => void
  updateItemPosition: (itemId: string, left: number, top: number) => void
  onAttributeEditStateChange: () => void
  addConnection: (connection: Connection) => void
  deleteConnection: (connectionId: string) => void
  setSelectedAttribute: (
    attr: {
      itemId: string
      itemType: 'entity' | 'source' | 'requirement'
      attrId: string
      attrName: string
    } | null
  ) => void
  toggleItemCollapsed: (itemId: string) => void
  updateItemObjectType: (itemId: string, objectType: string) => void
  setAttributeFilter: (itemId: string, filter: 'all' | 'mapped' | 'unmapped' | 'keys') => void
  updateItemWidth: (itemId: string, width: number) => void
  addCustomAttribute: (itemId: string, attribute: Attribute) => void
  updateAttribute: (itemId: string, attrId: string, updates: Partial<Attribute>) => void
  deleteAttribute: (itemId: string, attrId: string) => void
  // Mapping view - Sidebar props
  entityFilter: string
  sourceFilter: string
  requirementFilter: string
  onEntityFilterChange: (query: string) => void
  onSourceFilterChange: (query: string) => void
  onRequirementFilterChange: (query: string) => void
  onAddCustomEntity: (name: string, objectType?: string) => void
  onAddCustomEntityWithConcept?: (conceptId: string, name: string, objectType?: string) => void
  onAddCustomSource: (name: string, database?: string) => void
  onAddCustomRequirement: (name: string, reqType: string) => void
}

// ============================
// ViewRouter Component
// ============================

/**
 * ViewRouter component routes between different application views.
 * Memoized for performance to prevent unnecessary re-renders.
 *
 * @param activeView - The currently active view type
 *
 * @example
 * <ViewRouter activeView="mapping" />
 */
export const ViewRouter = memo(function ViewRouter(props: ViewRouterProps) {
  const { activeView } = props

  switch (activeView) {
    case 'mapping':
      return (
        <MappingViewV2
          // DiagramArea props
          diagramItems={props.diagramItems}
          connections={props.connections}
          positionUpdateCounter={props.positionUpdateCounter}
          collapseCounter={props.collapseCounter}
          filterUpdateCounter={props.filterUpdateCounter}
          editFormCounter={props.editFormCounter}
          onAddItem={props.addItemToDiagram}
          onHideItem={props.hideItem}
          onUpdatePosition={props.updateItemPosition}
          onAttributeEditStateChange={props.onAttributeEditStateChange}
          onAddConnection={props.addConnection}
          onDeleteConnection={props.deleteConnection}
          onToggleCollapsed={props.toggleItemCollapsed}
          onUpdateObjectType={props.updateItemObjectType}
          onSetAttributeFilter={props.setAttributeFilter}
          onUpdateWidth={props.updateItemWidth}
          onAddCustomAttribute={props.addCustomAttribute}
          onUpdateAttribute={props.updateAttribute}
          onDeleteAttribute={props.deleteAttribute}
          // Sidebar props
          entityFilter={props.entityFilter}
          sourceFilter={props.sourceFilter}
          requirementFilter={props.requirementFilter}
          onEntityFilterChange={props.onEntityFilterChange}
          onSourceFilterChange={props.onSourceFilterChange}
          onRequirementFilterChange={props.onRequirementFilterChange}
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
          // DependencyPanel props
          selectedAttribute={props.selectedAttribute}
          onSelectAttribute={props.setSelectedAttribute}
        />
      )

    case 'model':
      return (
        <ModelViewV2
          entities={props.projectedEntities}
          onAddCustomEntity={props.addCustomEntity}
          diagramItems={props.modelDiagramItems}
          relationships={props.modelRelationships}
          onAddItem={props.addModelItem}
          onHideItem={props.hideModelItem}
          onUpdatePosition={props.updateModelItemPosition}
          onUpdateObjectType={props.updateModelItemObjectType}
          onUpdateWidth={props.updateModelItemWidth}
          onAddRelationship={props.addModelRelationship}
          onDeleteRelationship={props.deleteModelRelationship}
          onUpdateRelationship={props.updateModelRelationship}
          onToggleCollapsed={props.toggleModelItemCollapsed}
          onSetAttributeFilter={props.setModelAttributeFilter}
          onAddCustomAttribute={props.addModelCustomAttribute}
          onUpdateAttribute={props.updateModelAttribute}
          onDeleteAttribute={props.deleteModelAttribute}
          onUpdateLogicalEntity={props.updateLogicalEntity}
          onUpdateLogicalAttribute={props.updateLogicalAttribute}
          concepts={props.concepts}
          logicalEntitiesRaw={props.logicalEntities}
          logicalAttributesRaw={props.logicalAttributes}
        />
      )

    case 'object':
      return (
        <ObjectViewV2
          concepts={props.concepts}
          entities={props.logicalEntities}
          attributes={props.logicalAttributes}
          onCreateConcept={props.createConcept}
          onUpdateConcept={props.updateConcept}
          onDeleteConcept={props.deleteConcept}
          onCreateEntity={props.createLogicalEntity}
          onUpdateEntity={props.updateLogicalEntity}
          onDeleteEntity={props.deleteLogicalEntity}
          onCreateAttribute={props.createLogicalAttribute}
          onRestoreAttribute={props.restoreLogicalAttribute}
          onUpdateAttribute={props.updateLogicalAttribute}
          onDeleteAttribute={props.deleteLogicalAttribute}
        />
      )

    case 'sources':
      return (
        <SourcesViewV2
          data={props.sourcesRawData}
          onDataUpdated={props.handleSourcesDataUpdated}
        />
      )

    case 'requirements':
      return (
        <RequirementsViewV2
          connections={props.connections}
          logicalAttributes={props.logicalAttributes}
          logicalEntities={props.logicalEntities}
          concepts={props.concepts}
        />
      )

    case 'catalog':
      return <CatalogView />

    case 'instructions':
      return <InstructionsView />

    case 'settings':
      return <SettingsView />

    default:
      // Exhaustive check - TypeScript will error if a case is missing
      const _exhaustiveCheck: never = activeView
      console.warn(`Unknown view type: ${activeView}`)
      return null
  }
})
