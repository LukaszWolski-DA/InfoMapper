/**
 * Intelligent Filter System - Generic Evaluator
 * 
 * Applies filter expressions to data arrays using schema definitions.
 */

import type { FilterExpression, FilterCondition, FilterSchema } from './types'
import { matchLike } from './parser'

/**
 * Evaluates a single condition against an item
 * 
 * @param condition - Filter condition to evaluate
 * @param item - Data item to check
 * @param context - Optional context (for hierarchical data)
 * @param schema - Filter schema with field definitions
 * @returns true if condition matches, false otherwise
 */
function evaluateCondition(
  condition: FilterCondition,
  item: any,
  context: any,
  schema: FilterSchema
): boolean {
  // Find field definition in schema
  const fieldDef = schema.fields.find(
    f => f.key.toLowerCase() === condition.field.toLowerCase()
  )
  
  if (!fieldDef) {
    console.warn(`Field "${condition.field}" not found in schema "${schema.name}"`)
    return false
  }
  
  // Get field value using path accessor
  const fieldValue = fieldDef.path(item, context)
  
  // Handle null/undefined
  if (fieldValue === null || fieldValue === undefined) {
    return false
  }
  
  // Convert to string for comparison (handles numbers, booleans)
  const valueStr = String(fieldValue)
  
  // Apply operator
  switch (condition.operator) {
    case '=':
      return valueStr === String(condition.value)
    
    case '!=':
      return valueStr !== String(condition.value)
    
    case 'IN':
      if (!Array.isArray(condition.value)) return false
      return condition.value.map(v => String(v)).includes(valueStr)
    
    case 'LIKE':
      return matchLike(valueStr, String(condition.value))
    
    case '>':
      return Number(fieldValue) > Number(condition.value)
    
    case '<':
      return Number(fieldValue) < Number(condition.value)
    
    case '>=':
      return Number(fieldValue) >= Number(condition.value)
    
    case '<=':
      return Number(fieldValue) <= Number(condition.value)
    
    default:
      console.warn(`Unknown operator: ${condition.operator}`)
      return false
  }
}

/**
 * Evaluates a complete filter expression against an item
 * 
 * @param expression - Filter expression with logic and conditions
 * @param item - Data item to check
 * @param context - Optional context (for hierarchical data)
 * @param schema - Filter schema with field definitions
 * @returns true if expression matches, false otherwise
 */
function evaluateExpression(
  expression: FilterExpression,
  item: any,
  context: any,
  schema: FilterSchema
): boolean {
  if (expression.conditions.length === 0) {
    return true // Empty expression = no filter = match all
  }
  
  if (expression.logic === 'AND') {
    return expression.conditions.every(cond =>
      evaluateCondition(cond, item, context, schema)
    )
  } else {
    return expression.conditions.some(cond =>
      evaluateCondition(cond, item, context, schema)
    )
  }
}

/**
 * Applies a filter expression to an array of items
 * 
 * @param data - Array of items to filter
 * @param expression - Filter expression to apply
 * @param schema - Filter schema with field definitions
 * @param contextBuilder - Optional function to build context for each item
 * @returns Filtered array
 * 
 * @example
 * ```typescript
 * const filtered = applyFilter(
 *   objects,
 *   { logic: 'AND', conditions: [{ field: 'Table', operator: 'LIKE', value: 'emp%' }] },
 *   sourcesFilterSchema,
 *   (obj) => ({ system: getSystem(obj), database: getDatabase(obj) })
 * )
 * ```
 */
export function applyFilter<T>(
  data: T[],
  expression: FilterExpression,
  schema: FilterSchema,
  contextBuilder?: (item: T) => any
): T[] {
  return data.filter(item => {
    const context = contextBuilder ? contextBuilder(item) : {}
    return evaluateExpression(expression, item, context, schema)
  })
}

/**
 * Validates that all fields in expression exist in schema
 * 
 * @param expression - Filter expression to validate
 * @param schema - Filter schema to validate against
 * @returns Array of unknown field names (empty if valid)
 */
export function validateExpression(
  expression: FilterExpression,
  schema: FilterSchema
): string[] {
  const unknownFields: string[] = []
  
  for (const condition of expression.conditions) {
    const fieldExists = schema.fields.some(
      f => f.key.toLowerCase() === condition.field.toLowerCase()
    )
    
    if (!fieldExists) {
      unknownFields.push(condition.field)
    }
  }
  
  return unknownFields
}








