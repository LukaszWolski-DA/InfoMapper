import { z } from "zod"

/**
 * Schema for diagram items representing entities, sources, or requirements
 * positioned on the canvas with display properties.
 */
export const DiagramItemSchema = z.object({
  itemId: z.string(),
  itemType: z.enum(["entity", "source", "requirement"]),
  left: z.number(),
  top: z.number(),
  hidden: z.boolean(),
  collapsed: z.boolean(),
  objectType: z.string().optional(),
  attributeFilter: z.enum(["all", "mapped", "unmapped", "keys"]).optional(),
  width: z.number().optional(),
  showOnlyMapped: z.boolean().optional(),
})
export type DiagramItem = z.infer<typeof DiagramItemSchema>

/**
 * Schema for connection endpoints linking attributes between diagram items.
 * Used as part of the ConnectionSchema.
 */
export const ConnectionEndpointSchema = z.object({
  attrId: z.string(),
  attrName: z.string(),
  parentId: z.string(),
  parentType: z.string(),
  itemId: z.string(),
})
export type ConnectionEndpoint = z.infer<typeof ConnectionEndpointSchema>

/**
 * Schema for connections between diagram items representing
 * attribute mappings or requirement mappings.
 */
export const ConnectionSchema = z.object({
  id: z.string(),
  type: z.enum(["attribute-mapping", "requirement-mapping"]),
  source: ConnectionEndpointSchema,
  target: ConnectionEndpointSchema,
})
export type Connection = z.infer<typeof ConnectionSchema>

/**
 * Schema for entity relationships in the logical model.
 * Defines cardinality, direction, and optionality of relationships.
 */
export const RelationshipSchema = z.object({
  id: z.string(),
  sourceEntityId: z.string(),
  targetEntityId: z.string(),
  label: z.string().optional().default(""),
  cardinality: z.enum(["1:1", "1:N", "M:N"]).optional().default("1:1"),
  minSource: z.union([z.literal(0), z.literal(1)]).optional(),
  maxSource: z.union([z.literal(1), z.literal("N")]).optional(),
  minTarget: z.union([z.literal(0), z.literal(1)]).optional(),
  maxTarget: z.union([z.literal(1), z.literal("N")]).optional(),
  direction: z.enum(["source-to-target", "target-to-source", "none"]).optional(),
})
export type Relationship = z.infer<typeof RelationshipSchema>

/**
 * Schema for logical model concepts that group related entities.
 * Concepts represent high-level business domains.
 */
export const ConceptSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number().optional(),
  color: z.string().optional(),
})
export type Concept = z.infer<typeof ConceptSchema>

/**
 * Schema for logical entities within the data warehouse model.
 * Each entity belongs to a concept and has a stereotype.
 */
export const LogicalEntitySchema = z.object({
  id: z.string(),
  conceptId: z.string(),
  name: z.string().min(1),
  stereotype: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
})
export type LogicalEntity = z.infer<typeof LogicalEntitySchema>

/**
 * Schema for logical attributes belonging to entities.
 * Defines data types, keys, nullability, and PII status.
 */
export const LogicalAttributeSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  name: z.string().min(1),
  dataType: z.string().optional(),
  isPrimaryKey: z.boolean().optional(),
  isForeignKey: z.boolean().optional(),
  isNullable: z.boolean().optional(),
  isPII: z.boolean().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
})
export type LogicalAttribute = z.infer<typeof LogicalAttributeSchema>

/**
 * Schema for requirements in the application.
 * Requirements can be functional, non-functional, or other types.
 */
export const RequirementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(["Functional", "Non-functional", "Other"]).optional(),
  displayId: z.number(),
  priority: z.string().optional(),
  status: z.string().optional(),
})
export type Requirement = z.infer<typeof RequirementSchema>

/**
 * Schema for the complete persisted application state.
 * Used for localStorage serialization and deserialization.
 */
export const PersistedStateSchema = z.object({
  timestamp: z.string().optional(),
  items: z.array(DiagramItemSchema).default([]),
  connections: z.array(ConnectionSchema).default([]),
  modelItems: z.array(DiagramItemSchema).optional().default([]),
  modelRelationships: z.array(RelationshipSchema).optional().default([]),
  concepts: z.array(ConceptSchema).optional().default([]),
  logicalEntities: z.array(LogicalEntitySchema).optional().default([]),
  logicalAttributes: z.array(LogicalAttributeSchema).optional().default([]),
  requirements: z.array(RequirementSchema).optional().default([]),
})
export type PersistedState = z.infer<typeof PersistedStateSchema>

// ============================
// Helper Validation Functions
// ============================

/**
 * Validates unknown data as a DiagramItem.
 *
 * @param data - The data to validate
 * @returns Validated DiagramItem
 * @throws {z.ZodError} If validation fails
 */
export function validateDiagramItem(data: unknown): DiagramItem {
  return DiagramItemSchema.parse(data)
}

/**
 * Validates unknown data as a Connection.
 *
 * @param data - The data to validate
 * @returns Validated Connection
 * @throws {z.ZodError} If validation fails
 */
export function validateConnection(data: unknown): Connection {
  return ConnectionSchema.parse(data)
}

/**
 * Validates unknown data as a PersistedState.
 *
 * @param data - The data to validate
 * @returns Validated PersistedState with default values applied
 * @throws {z.ZodError} If validation fails
 */
export function validatePersistedState(data: unknown): PersistedState {
  return PersistedStateSchema.parse(data)
}
