/**
 * Intelligent Filter System - Type Definitions
 * 
 * Provides type-safe filter definitions for InfoMapper cards.
 */

export type FieldType = 'string' | 'number' | 'boolean' | 'enum'

export type Operator = '=' | '!=' | 'IN' | 'LIKE' | '>' | '<' | '>=' | '<='

export type FilterCondition = {
  field: string
  operator: Operator
  value: string | string[] | number | boolean
}

export type FilterExpression = {
  logic: 'AND' | 'OR'
  conditions: FilterCondition[]
}

export type FieldDefinition = {
  key: string                          // Display name (e.g., "System", "Table")
  type: FieldType                      // Field data type
  values?: string[]                    // For enum type - allowed values
  path: (item: any, ctx?: any) => any  // Accessor function to get field value
  description?: string                 // Optional description for hints
}

export type FilterSchema = {
  name: string                         // Schema name (e.g., "Sources", "Object")
  defaultField: string                 // Default field for simple search
  fields: FieldDefinition[]            // Available fields
  supportedOperators: Operator[]       // Supported operators
  examples?: string[]                  // Example queries for users
}

export type ParseResult = {
  expression: FilterExpression
  mode: 'simple' | 'advanced'
  defaultField?: string
}

export type ParseError = {
  message: string
  position?: number
}








