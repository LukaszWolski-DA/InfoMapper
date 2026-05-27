import type { Concept, LogicalEntity, LogicalAttribute, Requirement, Connection, Relationship } from "../types"

export interface DocumentationScope {
  selectedEntityIds: string[]
  selectedRequirementIds: string[]
  sections: {
    executiveSummary: boolean
    entityDefinitions: boolean
    attributes: boolean
    sourceMappings: boolean
    relationships: boolean
    requirements: boolean
    diagrams: boolean
  }
}

export interface DocumentationData {
  concepts: Concept[]
  entities: LogicalEntity[]
  attributes: LogicalAttribute[]
  requirements: Requirement[]
  connections: Connection[]
  relationships: Relationship[]
}

export function generateMarkdown(
  scope: DocumentationScope,
  data: DocumentationData,
  erdSvg?: string
): string {
  const md: string[] = []

  // Get selected entities and requirements
  const selectedEntities = data.entities.filter(e => scope.selectedEntityIds.includes(e.id))
  const selectedRequirements = data.requirements.filter(r => scope.selectedRequirementIds.includes(r.id))

  // Get scope name
  const scopeName = getScopeName(selectedEntities, data.concepts)

  // Header
  md.push(`# Documentation: ${scopeName}`)
  md.push('')
  md.push(`**Generated:** ${new Date().toLocaleString()}`)
  md.push(`**Scope:** ${selectedEntities.length} entities, ${selectedRequirements.length} requirements`)
  md.push('')
  md.push('---')
  md.push('')

  // Executive Summary
  if (scope.sections.executiveSummary) {
    md.push(generateExecutiveSummary(selectedEntities, selectedRequirements, data))
  }

  // Entity Definitions
  if (scope.sections.entityDefinitions) {
    md.push(generateEntityDefinitions(selectedEntities, data, scope.sections))
  }

  // Relationships
  if (scope.sections.relationships) {
    md.push(generateRelationships(selectedEntities, data.relationships))
  }

  // ERD Diagram
  if (scope.sections.diagrams && erdSvg) {
    md.push('## Entity Relationship Diagram')
    md.push('')
    md.push(erdSvg)
    md.push('')
  }

  // Requirements
  if (scope.sections.requirements && selectedRequirements.length > 0) {
    md.push(generateRequirements(selectedRequirements, selectedEntities, data))
  }

  // Summary
  md.push(generateSummary(selectedEntities, selectedRequirements, data))

  return md.join('\n')
}

function getScopeName(entities: LogicalEntity[], concepts: Concept[]): string {
  if (entities.length === 0) return 'Empty Selection'
  if (entities.length === 1) return entities[0].name

  // Check if all entities belong to same concept
  const conceptIds = new Set(entities.map(e => e.conceptId))
  if (conceptIds.size === 1) {
    const conceptId = Array.from(conceptIds)[0]
    const concept = concepts.find(c => c.id === conceptId)
    return concept ? concept.name : 'Multiple Entities'
  }

  return 'Multiple Entities'
}

function generateExecutiveSummary(
  entities: LogicalEntity[],
  requirements: Requirement[],
  data: DocumentationData
): string {
  const md: string[] = []

  md.push('## Executive Summary')
  md.push('')
  md.push('### Overview')
  md.push('')
  md.push(`This document describes the data model for **${entities.length} entities**${requirements.length > 0 ? ` and **${requirements.length} requirements**` : ''}.`)
  md.push('')

  // Entities covered
  md.push('### Entities Covered')
  md.push('')
  entities.forEach(entity => {
    const stereotype = entity.stereotype || 'Object'
    md.push(`- ${entity.name} (${stereotype})`)
  })
  md.push('')

  // Requirements covered
  if (requirements.length > 0) {
    md.push('### Requirements Covered')
    md.push('')
    requirements.forEach(req => {
      const type = req.type || 'Other'
      md.push(`- REQ-${req.displayId}: ${req.name} (${type})`)
    })
    md.push('')
  }

  // Statistics
  const entityIds = new Set(entities.map(e => e.id))
  const attributes = data.attributes.filter(a => entityIds.has(a.entityId))
  const piiCount = attributes.filter(a => a.isPII).length
  const pkCount = attributes.filter(a => a.isPrimaryKey).length
  const fkCount = attributes.filter(a => a.isForeignKey).length

  md.push('### Statistics')
  md.push('')
  md.push(`- Total Attributes: ${attributes.length}`)
  if (piiCount > 0) md.push(`- PII Attributes: ${piiCount}`)
  md.push(`- Primary Keys: ${pkCount}`)
  md.push(`- Foreign Keys: ${fkCount}`)
  md.push('')
  md.push('---')
  md.push('')

  return md.join('\n')
}

function generateEntityDefinitions(
  entities: LogicalEntity[],
  data: DocumentationData,
  sections: DocumentationScope['sections']
): string {
  const md: string[] = []

  md.push('## Entity Definitions')
  md.push('')

  entities.forEach(entity => {
    md.push(`### Entity: ${entity.name}`)
    md.push('')

    // Metadata
    if (entity.stereotype) md.push(`**Type:** ${entity.stereotype}`)

    const concept = data.concepts.find(c => c.id === entity.conceptId)
    if (concept) md.push(`**Concept:** ${concept.name}`)

    if (entity.description) {
      md.push(`**Description:** ${entity.description}`)
    }

    if (entity.tags && entity.tags.length > 0) {
      md.push(`**Tags:** ${entity.tags.map(t => `\`${t}\``).join(', ')}`)
    }

    md.push('')

    // Attributes table
    if (sections.attributes) {
      const attributes = data.attributes.filter(a => a.entityId === entity.id)
      if (attributes.length > 0) {
        md.push('#### Attributes')
        md.push('')
        md.push('| Name | Type | Constraints | Flags | Description |')
        md.push('|------|------|-------------|-------|-------------|')

        attributes.forEach(attr => {
          const type = attr.dataType || 'String'
          const constraints: string[] = []
          if (attr.isPrimaryKey) constraints.push('PK')
          if (attr.isForeignKey) constraints.push('FK')
          if (attr.isNullable === false) constraints.push('NOT NULL')

          const flags: string[] = []
          if (attr.isPII) flags.push('PII')

          const description = attr.description || '-'

          md.push(`| ${attr.name} | ${type} | ${constraints.join(', ') || '-'} | ${flags.join(', ') || '-'} | ${description} |`)
        })

        md.push('')

        // Primary/Foreign keys summary
        const pks = attributes.filter(a => a.isPrimaryKey)
        const fks = attributes.filter(a => a.isForeignKey)

        if (pks.length > 0) {
          md.push(`**Primary Key:** ${pks.map(a => a.name).join(', ')}`)
        }
        if (fks.length > 0) {
          md.push(`**Foreign Keys:** ${fks.map(a => a.name).join(', ')}`)
        }

        md.push('')
      }
    }

    // Source mappings
    if (sections.sourceMappings) {
      // Get connections where this entity is the target
      const mappings = data.connections.filter(
        c => c.type === 'attribute-mapping' && c.target.parentId === entity.id
      )

      if (mappings.length > 0) {
        md.push('#### Source Mappings')
        md.push('')

        // Group by source system
        const sourceGroups = new Map<string, typeof mappings>()
        mappings.forEach(conn => {
          const key = conn.source.parentId
          if (!sourceGroups.has(key)) {
            sourceGroups.set(key, [])
          }
          sourceGroups.get(key)!.push(conn)
        })

        sourceGroups.forEach((conns, sourceId) => {
          const firstConn = conns[0]
          md.push(`**Source:** ${firstConn.source.parentType}`)
          md.push('')
          md.push('| Source Column | Target Attribute | Notes |')
          md.push('|---------------|------------------|-------|')

          conns.forEach(conn => {
            md.push(`| ${conn.source.attrName} | ${conn.target.attrName} | Direct mapping |`)
          })

          md.push('')
        })
      }
    }

    md.push('---')
    md.push('')
  })

  return md.join('\n')
}

function generateRelationships(
  entities: LogicalEntity[],
  relationships: Relationship[]
): string {
  const md: string[] = []

  const entityIds = new Set(entities.map(e => e.id))

  // Filter relationships to only those between selected entities
  const relevantRelationships = relationships.filter(
    r => entityIds.has(r.sourceEntityId) && entityIds.has(r.targetEntityId)
  )

  if (relevantRelationships.length === 0) {
    return ''
  }

  md.push('## Relationships')
  md.push('')

  relevantRelationships.forEach(rel => {
    const sourceEntity = entities.find(e => e.id === rel.sourceEntityId)
    const targetEntity = entities.find(e => e.id === rel.targetEntityId)

    if (!sourceEntity || !targetEntity) return

    md.push(`### ${sourceEntity.name} ↔ ${targetEntity.name}`)
    md.push('')
    md.push(`**Type:** ${rel.cardinality}`)
    if (rel.label) md.push(`**Label:** "${rel.label}"`)
    if (rel.direction) md.push(`**Direction:** ${rel.direction}`)
    md.push('')
  })

  md.push('---')
  md.push('')

  return md.join('\n')
}

function generateRequirements(
  requirements: Requirement[],
  entities: LogicalEntity[],
  data: DocumentationData
): string {
  const md: string[] = []

  md.push('## Requirements')
  md.push('')

  requirements.forEach(req => {
    md.push(`### REQ-${req.displayId}: ${req.name}`)
    md.push('')

    if (req.type) md.push(`**Type:** ${req.type}`)
    if (req.status) md.push(`**Status:** ${req.status}`)
    if (req.priority) md.push(`**Priority:** ${req.priority}`)

    if (req.description) {
      md.push('')
      md.push(`**Description:**`)
      md.push('')
      md.push(req.description)
    }

    // Find linked entities (via connections)
    const entityIds = new Set(entities.map(e => e.id))
    const linkedConns = data.connections.filter(
      c => c.type === 'requirement-mapping' &&
           c.source.itemId === req.id &&
           entityIds.has(c.target.parentId)
    )

    if (linkedConns.length > 0) {
      md.push('')
      md.push('**Linked Entities:**')
      const linkedEntityIds = new Set(linkedConns.map(c => c.target.parentId))
      linkedEntityIds.forEach(entityId => {
        const entity = entities.find(e => e.id === entityId)
        if (entity) {
          md.push(`- ${entity.name}`)
        }
      })
    }

    md.push('')
    md.push('---')
    md.push('')
  })

  return md.join('\n')
}

function generateSummary(
  entities: LogicalEntity[],
  requirements: Requirement[],
  data: DocumentationData
): string {
  const md: string[] = []

  md.push('## Summary')
  md.push('')

  const entityIds = new Set(entities.map(e => e.id))
  const attributes = data.attributes.filter(a => entityIds.has(a.entityId))
  const piiCount = attributes.filter(a => a.isPII).length

  md.push(`**Scope:** ${entities.length} entities, ${requirements.length} requirements`)
  md.push(`**Attributes:** ${attributes.length} (${piiCount} PII)`)
  md.push('')

  // Coverage checklist
  md.push('**Coverage:**')
  const entitiesWithoutPK = entities.filter(e => {
    const attrs = data.attributes.filter(a => a.entityId === e.id)
    return !attrs.some(a => a.isPrimaryKey)
  })

  const entitiesWithoutDesc = entities.filter(e => !e.description)

  if (entitiesWithoutPK.length === 0) {
    md.push('- ✅ All entities have Primary Keys')
  } else {
    md.push(`- ⚠️ ${entitiesWithoutPK.length} entities missing Primary Keys`)
  }

  if (piiCount > 0) {
    md.push(`- ✅ ${piiCount} PII attributes flagged`)
  }

  if (entitiesWithoutDesc.length > 0) {
    md.push(`- ⚠️ ${entitiesWithoutDesc.length} entities missing descriptions`)
  }

  md.push('')
  md.push('---')
  md.push('')
  md.push('**End of Documentation**')

  return md.join('\n')
}
