/**
 * Intelligent Filter System - Schema Definitions
 * 
 * Defines filter schemas for all InfoMapper cards.
 */

import type { FilterSchema } from './types'

/**
 * Sources Filter Schema
 * 
 * Supports filtering source systems, databases, schemas, tables, and columns.
 */
export const sourcesFilterSchema: FilterSchema = {
  name: 'Sources',
  defaultField: 'Table',
  fields: [
    {
      key: 'System',
      type: 'string',
      path: (obj, ctx) => ctx?.system?.name,
      description: 'Source system name (e.g., HR, CRM, Finance)'
    },
    {
      key: 'Database',
      type: 'string',
      path: (obj, ctx) => ctx?.database?.name,
      description: 'Database name within the system'
    },
    {
      key: 'Schema',
      type: 'string',
      path: (obj, ctx) => ctx?.schema?.name,
      description: 'Schema name within the database'
    },
    {
      key: 'Table',
      type: 'string',
      path: (obj) => obj.name,
      description: 'Table or view name'
    },
    {
      key: 'ObjectType',
      type: 'enum',
      values: ['table', 'view'],
      path: (obj) => obj.objectType,
      description: 'Type of database object'
    }
  ],
  supportedOperators: ['=', '!=', 'IN', 'LIKE'],
  examples: [
    'employee',
    'System = "HR"',
    'Table LIKE "emp%"',
    'System = "HR" AND Table LIKE "emp%"',
    'ObjectType = "table"',
    'Database IN ("hrdb", "crmdb")',
    'System = "HR" OR System = "CRM"',
    'Table LIKE "%customer%" AND ObjectType != "view"'
  ]
}

/**
 * Object (Logical Model) Filter Schema
 * 
 * Supports filtering concepts, entities, and attributes.
 */
export const objectFilterSchema: FilterSchema = {
  name: 'Object',
  defaultField: 'Attribute',
  fields: [
    {
      key: 'Concept',
      type: 'string',
      path: (attr, ctx) => ctx?.concept?.name,
      description: 'Concept name (logical grouping)'
    },
    {
      key: 'Entity',
      type: 'string',
      path: (attr, ctx) => ctx?.entity?.name,
      description: 'Entity name (table/object)'
    },
    {
      key: 'Attribute',
      type: 'string',
      path: (attr) => attr.name,
      description: 'Attribute name (column)'
    },
    {
      key: 'DataType',
      type: 'string',
      path: (attr) => attr.dataType,
      description: 'Attribute data type'
    },
    {
      key: 'IsPrimaryKey',
      type: 'boolean',
      path: (attr) => attr.isPrimaryKey,
      description: 'Whether attribute is a primary key'
    },
    {
      key: 'IsPII',
      type: 'boolean',
      path: (attr) => attr.isPII,
      description: 'Whether attribute contains PII data'
    },
    {
      key: 'Stereotype',
      type: 'enum',
      values: ['Object', 'Link', 'Dictionary', 'Context', 'Informative'],
      path: (attr, ctx) => ctx?.entity?.stereotype,
      description: 'Entity stereotype'
    }
  ],
  supportedOperators: ['=', '!=', 'IN', 'LIKE'],
  examples: [
    'customer',
    'Concept = "Sales"',
    'Stereotype = "Object"',
    'Attribute LIKE "%id"',
    'IsPrimaryKey = "true"',
    'Entity LIKE "Cust%" AND Stereotype = "Object"'
  ]
}

/**
 * Requirements Filter Schema
 * 
 * Supports filtering requirements by REQ_ID, name, type, and description.
 */
export const requirementsFilterSchema: FilterSchema = {
  name: 'Requirements',
  defaultField: 'RequirementName',
  fields: [
    {
      key: 'REQ_ID',
      type: 'number',
      path: (req) => req.displayId,
      description: 'Requirement display ID (numeric)'
    },
    {
      key: 'RequirementName',
      type: 'string',
      path: (req) => req.name,
      description: 'Requirement name'
    },
    {
      key: 'RequirementType',
      type: 'enum',
      values: ['Functional', 'Non-functional', 'Other'],
      path: (req) => req.type,
      description: 'Requirement type'
    }
  ],
  supportedOperators: ['=', '!=', 'IN', 'LIKE'],
  examples: [
    'authentication',
    'REQ_ID = 123456',
    'RequirementType = "Functional"',
    'RequirementName LIKE "Auth%"',
    'RequirementType IN ("Functional", "Non-functional")'
  ]
}

