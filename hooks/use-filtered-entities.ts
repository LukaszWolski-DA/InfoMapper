import { useMemo } from "react"
import type { Entity, LogicalAttribute } from "@/lib/types"

/**
 * Custom hook to filter entities based on filtered attributes
 * 
 * Logic:
 * - If all attributes are visible (no filter), show all entities
 * - Otherwise, only show entities that have at least one matching attribute
 * 
 * Used in: Object_v2, Model_v2
 */
export function useFilteredEntities(
  entities: Entity[],
  filteredAttributes: LogicalAttribute[],
  allAttributesCount: number
): Entity[] {
  return useMemo(() => {
    // If no filter applied (all attributes visible), show all entities
    if (filteredAttributes.length === allAttributesCount) {
      return entities
    }
    
    // Otherwise, filter entities to only those with matching attributes
    const filteredAttrIds = new Set(filteredAttributes.map(a => a.id))
    return entities
      .map(entity => ({
        ...entity,
        attributes: entity.attributes.filter(attr => filteredAttrIds.has(attr.id))
      }))
      .filter(entity => entity.attributes.length > 0) // Remove entities with no matching attributes
  }, [entities, filteredAttributes, allAttributesCount])
}





