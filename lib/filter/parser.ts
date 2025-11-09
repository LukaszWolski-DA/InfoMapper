/**
 * Intelligent Filter System - Query Parser
 * 
 * Parses filter queries with smart detection:
 * - Simple mode: "employee" → Table LIKE "%employee%"
 * - Advanced mode: "System = "HR" AND Table LIKE "emp%""
 */

import type { FilterExpression, FilterCondition, ParseResult, ParseError } from './types'

/**
 * Detects if query uses advanced syntax (operators, logic keywords)
 */
function hasAdvancedSyntax(query: string): boolean {
  // Check for operators and logic keywords
  return /[=!<>]|IN|LIKE|AND|OR/i.test(query)
}

/**
 * Parse simple text query into LIKE filter
 */
function parseSimpleQuery(query: string, defaultField: string): FilterExpression {
  const trimmed = query.trim()
  
  return {
    logic: 'AND',
    conditions: [{
      field: defaultField,
      operator: 'LIKE',
      value: `%${trimmed}%`  // Wildcard both sides for flexible matching
    }]
  }
}

/**
 * Parse advanced query with operators and logic
 */
function parseAdvancedQuery(query: string): FilterExpression {
  // Determine logic operator (OR takes precedence if mixed)
  let logic: 'AND' | 'OR' = 'AND'
  let parts: string[]
  
  if (query.match(/\s+OR\s+/i)) {
    logic = 'OR'
    parts = query.split(/\s+OR\s+/i)
  } else {
    parts = query.split(/\s+AND\s+/i)
  }
  
  const conditions: FilterCondition[] = []
  
  for (const part of parts) {
    const trimmed = part.trim()

    // Match: Field = "value" or Field = true/false (boolean without quotes)
    const equalMatch = trimmed.match(/^(\w+)\s*=\s*(?:"([^"]+)"|(true|false))$/i)
    if (equalMatch) {
      const value = equalMatch[2] !== undefined ? equalMatch[2] : equalMatch[3]
      conditions.push({
        field: equalMatch[1],
        operator: '=',
        value: value
      })
      continue
    }

    // Match: Field != "value" or Field != true/false
    const notEqualMatch = trimmed.match(/^(\w+)\s*(?:!=|<>)\s*(?:"([^"]+)"|(true|false))$/i)
    if (notEqualMatch) {
      const value = notEqualMatch[2] !== undefined ? notEqualMatch[2] : notEqualMatch[3]
      conditions.push({
        field: notEqualMatch[1],
        operator: '!=',
        value: value
      })
      continue
    }
    
    // Match: Field LIKE "pattern"
    const likeMatch = trimmed.match(/^(\w+)\s+LIKE\s+"([^"]+)"$/i)
    if (likeMatch) {
      conditions.push({
        field: likeMatch[1],
        operator: 'LIKE',
        value: likeMatch[2]
      })
      continue
    }
    
    // Match: Field IN ("val1", "val2", ...)
    const inMatch = trimmed.match(/^(\w+)\s+IN\s*\(([^)]+)\)$/i)
    if (inMatch) {
      const values = inMatch[2]
        .split(',')
        .map(v => v.trim())
        .map(v => v.replace(/^["']|["']$/g, ''))  // Remove quotes from both ends
      conditions.push({
        field: inMatch[1],
        operator: 'IN',
        value: values
      })
      continue
    }
    
    throw new Error(`Invalid condition: ${trimmed}`)
  }
  
  return { logic, conditions }
}

/**
 * Main parser function with smart detection
 * 
 * @param query - User input query string
 * @param defaultField - Default field for simple search (e.g., "Table")
 * @returns ParseResult with expression and mode, or throws ParseError
 */
export function parseFilterQuery(
  query: string,
  defaultField: string
): ParseResult | ParseError {
  try {
    const trimmed = query.trim()
    
    // Empty query
    if (!trimmed) {
      return {
        expression: { logic: 'AND', conditions: [] },
        mode: 'simple'
      }
    }
    
    // Detect mode
    if (hasAdvancedSyntax(trimmed)) {
      // Advanced mode
      const expression = parseAdvancedQuery(trimmed)
      return {
        expression,
        mode: 'advanced'
      }
    } else {
      // Simple mode
      const expression = parseSimpleQuery(trimmed, defaultField)
      return {
        expression,
        mode: 'simple',
        defaultField
      }
    }
  } catch (err) {
    return {
      message: err instanceof Error ? err.message : 'Invalid filter syntax'
    } as ParseError
  }
}

/**
 * Helper: Match LIKE pattern (supports % wildcard and _ single char)
 */
export function matchLike(text: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')  // Escape special regex chars
    .replace(/%/g, '.*')                      // Replace % with .*
    .replace(/_/g, '.')                       // Replace _ with .
  const regex = new RegExp(`^${regexPattern}$`, 'i')
  return regex.test(text)
}








