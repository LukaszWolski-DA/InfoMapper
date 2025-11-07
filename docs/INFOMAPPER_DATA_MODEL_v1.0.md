# InfoMapper - Data Model Documentation

**Version:** 1.0  
**Last Updated:** 2025-11-04  
**Author:** Architecture Analysis  
**Status:** Production

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Core Domain Model](#core-domain-model)
4. [Projection Model](#projection-model)
5. [UI & Mapping Layer](#ui--mapping-layer)
6. [Sources Domain](#sources-domain)
7. [State Management](#state-management)
8. [ID Generation](#id-generation)
9. [Data Relationships](#data-relationships)
10. [Storage & Persistence](#storage--persistence)
11. [Type Definitions Reference](#type-definitions-reference)
12. [Migration Guide](#migration-guide)

---

## 1. Overview

### System Architecture

InfoMapper uses a **layered architecture** separating:
- **Domain Layer** - Core business entities (Concept, LogicalEntity, LogicalAttribute)
- **Projection Layer** - View-specific transformations (Entity, Attribute for UI)
- **UI Layer** - Visual representation (DiagramItem, Connection, Relationship)
- **Sources Layer** - Physical source metadata (System, Database, Schema, Object, Column)
- **Storage Layer** - Persistence in localStorage

### Key Design Decisions

1. **Separation of Logical Model from Physical Sources**
   - Logical model: What data means (business perspective)
   - Physical sources: Where data comes from (technical perspective)
   - Connections: How logical maps to physical

2. **Projection Pattern**
   - Domain model → Projection functions → View-specific models
   - Enables different views to use same data differently

3. **Metadata-Driven Approach**
   - Everything is metadata: concepts, entities, attributes, relationships
   - Supports automation and code generation

---

## 2. Architecture Principles

### 2.1 Single Source of Truth

**Domain Model** is the source of truth:
```
Concept → LogicalEntity → LogicalAttribute
```

**All other representations are projections**:
- Mapping view uses projected `Entity[]`
- Model view uses projected `Entity[]`
- Catalog view uses raw `LogicalEntity[]`

### 2.2 Immutability & State Updates

State updates follow **command pattern**:
```typescript
// Commands in lib/commands.ts
addEntity(conceptId, name)
updateEntity(id, updates)
deleteEntity(id)

// All mutations go through store
setObjectState(updater)
```

### 2.3 View Independence

Each view has independent UI state:
- Diagram positions (DiagramItem)
- Connections (Connection)
- Relationships (Relationship)

Domain data (Concept/Entity/Attribute) is **shared** across views.

---

## 3. Core Domain Model

### 3.1 Concept

**Purpose:** Top-level grouping of related entities (business domain)

**Location:** `lib/types.ts`

**Type Definition:**
```typescript
interface Concept {
  id: string              // Unique ID (prefix: conc_)
  name: string            // Display name
  description?: string    // Optional description
  order?: number          // Display order in UI
  color?: string          // Visual color (hex format)
}
```

**Business Rules:**
- ✅ Name should be unique within project (not enforced, but recommended)
- ✅ Color is optional, defaults to auto-assigned in UI
- ✅ Concepts can be empty (no entities)
- ✅ Deleting concept **cascades** - deletes all child entities & attributes
- ⚠️ No concept = orphaned entities (prevented by UI)

**Examples:**
```typescript
{
  id: "conc_abc123",
  name: "Customer Domain",
  description: "All entities related to customer management",
  order: 1,
  color: "#3B82F6"
}

{
  id: "conc_def456",
  name: "Product Catalog",
  order: 2,
  color: "#10B981"
}
```

**Relationships:**
- 1:N with LogicalEntity (one concept, many entities)

**Storage:**
- GlobalState.concepts: Concept[]
- Persisted to localStorage key: `infoMapperStateV1`

---

### 3.2 LogicalEntity

**Purpose:** Business entity representing a concept in the data model

**Location:** `lib/types.ts`

**Type Definition:**
```typescript
interface LogicalEntity {
  id: string                    // Unique ID (prefix: lent_)
  conceptId: string             // Parent concept ID (FK)
  name: string                  // Entity name
  stereotype?: "Object" | "Link" | "Dictionary" | "Context" | "Informative" | string
  description?: string          // Optional description
  tags?: string[]              // Optional tags for categorization
}
```

**Business Rules:**
- ✅ Name should be unique within project (not enforced)
- ✅ Must belong to a concept (conceptId required)
- ✅ Stereotype defaults to "Object"
- ✅ Deleting entity **cascades** - deletes all child attributes
- ✅ Entity without attributes is valid (may be early stage of design)
- ⚠️ Tags are free-form strings (no validation)

**Stereotypes Explained:**
| Stereotype | Purpose | Examples |
|-----------|---------|----------|
| **Object** | Primary business object | Customer, Product, Order |
| **Link** | Association entity (junction table) | OrderItem (Order ↔ Product) |
| **Dictionary** | Lookup/reference data | Country, Status, Category |
| **Context** | Contextual information | BusinessUnit, Region, Department |
| **Informative** | Supplementary data | AuditLog, Note, Comment |

**Examples:**
```typescript
{
  id: "lent_xyz789",
  conceptId: "conc_abc123",
  name: "Customer",
  stereotype: "Object",
  description: "Individual or organization that purchases products",
  tags: ["core", "gdpr", "pii"]
}

{
  id: "lent_link001",
  conceptId: "conc_abc123",
  name: "CustomerAddress",
  stereotype: "Link",
  description: "Links customers to their addresses"
}
```

**Relationships:**
- N:1 with Concept (many entities, one concept)
- 1:N with LogicalAttribute (one entity, many attributes)
- M:N with other LogicalEntity via Relationship

**Storage:**
- GlobalState.logicalEntities: LogicalEntity[]
- Persisted to localStorage

---

### 3.3 LogicalAttribute

**Purpose:** Property/field of a logical entity

**Location:** `lib/types.ts`

**Type Definition:**
```typescript
interface LogicalAttribute {
  id: string                    // Unique ID (prefix: latr_)
  entityId: string              // Parent entity ID (FK)
  name: string                  // Attribute name
  dataType?: "String" | "Integer" | "Decimal" | "Boolean" | "Date" | "JSON" | string
  isPrimaryKey?: boolean        // PK flag
  isForeignKey?: boolean        // FK flag
  isNullable?: boolean          // Nullability
  isPII?: boolean              // Personal Identifiable Information flag
  description?: string          // Optional description
  order?: number               // Display order within entity
}
```

**Business Rules:**
- ✅ Name should be unique within parent entity (not enforced)
- ✅ Must belong to an entity (entityId required)
- ✅ dataType is optional (may be undefined during design phase)
- ⚠️ isPrimaryKey and isForeignKey **not mutually exclusive** in current implementation (should be validated)
- ✅ isPII flag for GDPR/compliance tracking
- ✅ Order determines display sequence (default: 0, then alphabetical)

**Data Types:**
| Type | Description | Physical Mapping |
|------|-------------|------------------|
| **String** | Text data | VARCHAR, TEXT, CHAR |
| **Integer** | Whole numbers | INT, BIGINT, SMALLINT |
| **Decimal** | Floating point | DECIMAL, NUMERIC, FLOAT, DOUBLE |
| **Boolean** | True/false | BIT, BOOLEAN, TINYINT |
| **Date** | Date/datetime | DATE, DATETIME, TIMESTAMP |
| **JSON** | Structured JSON | JSON, JSONB, TEXT |
| **Custom** | Any other string | UUID, GEOGRAPHY, XML, etc. |

**Examples:**
```typescript
{
  id: "latr_pk001",
  entityId: "lent_xyz789",
  name: "customer_id",
  dataType: "Integer",
  isPrimaryKey: true,
  isNullable: false,
  description: "Unique customer identifier",
  order: 1
}

{
  id: "latr_email001",
  entityId: "lent_xyz789",
  name: "email",
  dataType: "String",
  isNullable: false,
  isPII: true,
  description: "Customer email address",
  order: 3
}

{
  id: "latr_fk001",
  entityId: "lent_link001",
  name: "customer_id",
  dataType: "Integer",
  isForeignKey: true,
  isNullable: false,
  description: "Reference to customer",
  order: 1
}
```

**Relationships:**
- N:1 with LogicalEntity (many attributes, one entity)
- M:N with SourceColumn via Connection (attribute mapping)

**Storage:**
- GlobalState.logicalAttributes: LogicalAttribute[]
- Persisted to localStorage

---

### 3.4 Requirement (Domain)

**Purpose:** Business or technical requirement

**Location:** `lib/store.ts` (RequirementRow type)

**Type Definition:**
```typescript
type RequirementRow = {
  id: string                                          // Unique ID (prefix: req_)
  name: string                                        // Requirement title
  description?: string                                // Detailed description
  type?: "Functional" | "Non-functional" | "Other"   // Requirement type
  displayId: number                                   // Human-readable ID (e.g., 100001)
}
```

**Note:** There's a **discrepancy** between:
- `lib/types.ts` - has `Requirement` with `priority` and `status`
- `lib/store.ts` - has `RequirementRow` with `type` and `displayId`

**Current Implementation Uses:** `RequirementRow` from store.ts

**Business Rules:**
- ✅ Name is required
- ✅ Description is optional (can be empty string)
- ✅ Type defaults to "Functional"
- ✅ displayId is auto-generated random 6-digit number (100000-999999)
- ⚠️ displayId is NOT sequential (random generation)
- ⚠️ No validation for duplicate names

**Requirement Types:**
- **Functional** - What the system should do (e.g., "User can login")
- **Non-functional** - Quality attributes (e.g., "Response time < 2s")
- **Other** - Anything else (constraints, assumptions, etc.)

**Examples:**
```typescript
{
  id: "req_abc123",
  name: "User Authentication",
  description: "System must authenticate users via email/password",
  type: "Functional",
  displayId: 100234
}

{
  id: "req_def456",
  name: "GDPR Compliance",
  description: "All PII data must be encrypted at rest",
  type: "Non-functional",
  displayId: 100567
}
```

**Relationships:**
- M:N with LogicalEntity via Connection (requirement-mapping)
- M:N with Source via Connection (requirement-mapping)

**Storage:**
- GlobalState.requirements: RequirementRow[]
- Persisted to localStorage

**⚠️ TODO:** Reconcile type discrepancy between types.ts and store.ts

---

## 4. Projection Model

### 4.1 Overview

**Purpose:** Transform domain model to UI-specific shapes

**Location:** `lib/projections.ts`

**Pattern:**
```
Domain Model (LogicalEntity) → Projection Function → View Model (Entity)
```

### 4.2 Entity (Projection)

**Purpose:** UI representation of LogicalEntity for Mapping/Model views

**Type Definition:**
```typescript
interface Entity {
  id: string              // Same as LogicalEntity.id
  name: string            // Same as LogicalEntity.name
  nameEn: string          // Same as name (duplicate)
  stereotype: string      // Normalized stereotype
  status: string          // Always "Custom"
  attributes: Attribute[] // Projected LogicalAttributes
}
```

**Projection Logic:**
```typescript
function projectEntities(params: {
  concepts: Concept[]
  logicalEntities: LogicalEntity[]
  logicalAttributes: LogicalAttribute[]
}): Entity[]
```

**Business Rules:**
- ✅ Generated on-demand (not stored)
- ✅ Attributes sorted by `order` field, then alphabetically
- ✅ Stereotype is normalized (Object/Link/Dictionary/etc.)
- ✅ Status is always "Custom" (hardcoded)

### 4.3 Attribute (Projection)

**Purpose:** UI representation of LogicalAttribute

**Type Definition:**
```typescript
interface Attribute {
  id: string              // Same as LogicalAttribute.id
  name: string            // Same as LogicalAttribute.name
  nameEn?: string         // Same as name
  stereotype: string      // "PK" | "FK" | "Attribute"
  isPrimaryKey?: boolean  // From LogicalAttribute
  isForeignKey?: boolean  // From LogicalAttribute
  isPII?: boolean        // From LogicalAttribute
  dataType?: string      // From LogicalAttribute
}
```

**Projection Logic:**
- `stereotype` derived from flags:
  - `isPrimaryKey === true` → "PK"
  - `isForeignKey === true` → "FK"
  - else → "Attribute"

---

## 5. UI & Mapping Layer

### 5.1 DiagramItem

**Purpose:** Position and UI state of item on diagram (Mapping/Model views)

**Location:** `lib/types.ts`

**Type Definition:**
```typescript
interface DiagramItem {
  itemId: string                                      // References Entity.id, Source.id, or Requirement.id
  itemType: "entity" | "source" | "requirement"      // Type of item
  left: number                                        // X position (pixels)
  top: number                                         // Y position (pixels)
  hidden: boolean                                     // Visibility flag
  collapsed: boolean                                  // Expanded/collapsed state
  objectType?: string                                // Stereotype (for entities)
  attributeFilter?: "all" | "mapped" | "unmapped" | "keys"  // Attribute visibility
  width?: number                                     // Custom width (pixels)
  showOnlyMapped?: boolean                           // UI hint for mapping filters
}
```

**Business Rules:**
- ✅ itemId references an entity/source/requirement ID
- ✅ Position (left, top) relative to diagram container
- ✅ Snaps to 16px grid on drag
- ✅ Default width: 200px, min: 200px, max: 600px
- ✅ hidden vs collapsed: hidden removes from diagram, collapsed hides attributes
- ⚠️ No validation that itemId exists

**Usage:**
- **Mapping View:** Uses GlobalState.items (DiagramItem[])
- **Model View:** Uses GlobalState.modelItems (DiagramItem[])
- Same entity can exist in both views with different positions

**Storage:**
- GlobalState.items: DiagramItem[] (Mapping)
- GlobalState.modelItems: DiagramItem[] (Model)
- Separate arrays = independent positioning

### 5.2 Connection

**Purpose:** Maps attributes between entities/sources or links requirements

**Location:** `lib/types.ts`

**Type Definition:**
```typescript
interface Connection {
  id: string                        // Unique ID (prefix: conn_)
  type: "attribute-mapping" | "requirement-mapping"
  source: {
    attrId: string                  // Empty string for entity-level
    attrName: string
    parentId: string                // Entity/Source/Requirement ID
    parentType: string              // "entity" | "source" | "requirement"
    itemId: string                  // DiagramItem ID
  }
  target: {
    attrId: string                  // Empty string for entity-level
    attrName: string
    parentId: string                // Entity/Source/Requirement ID
    parentType: string              // "entity" | "source" | "requirement"
    itemId: string                  // DiagramItem ID
  }
}
```

**Connection Types:**

**Attribute Mapping:**
- Maps attribute from source to entity
- `attrId` is populated (specific attribute)
- Example: `crm.customers.email` → `Customer.email`

**Requirement Mapping:**
- Links requirement to entity/source
- `attrId` may be empty (entity-level)
- Example: Requirement "GDPR Compliance" → `Customer` entity

**Entity-Level Connection:**
- `attrId` is empty string
- `attrName` may be entity name or requirement name
- Links entire entity/requirement

**Business Rules:**
- ✅ source and target can be any combination of entity/source/requirement
- ✅ Common: source (Source) → target (Entity)
- ✅ attrId empty = entity/requirement level connection
- ⚠️ No validation for duplicate connections
- ⚠️ No validation that attrId exists

**Examples:**
```typescript
// Attribute mapping: Source → Entity
{
  id: "conn_map001",
  type: "attribute-mapping",
  source: {
    attrId: "col_email123",
    attrName: "email",
    parentId: "obj_customers001",
    parentType: "source",
    itemId: "item_src001"
  },
  target: {
    attrId: "latr_email001",
    attrName: "email",
    parentId: "lent_customer001",
    parentType: "entity",
    itemId: "item_ent001"
  }
}

// Requirement mapping: Requirement → Entity
{
  id: "conn_req001",
  type: "requirement-mapping",
  source: {
    attrId: "",                       // Empty = requirement-level
    attrName: "GDPR Compliance",
    parentId: "req_gdpr001",
    parentType: "requirement",
    itemId: "item_req001"
  },
  target: {
    attrId: "",                       // Empty = entity-level
    attrName: "Customer",
    parentId: "lent_customer001",
    parentType: "entity",
    itemId: "item_ent001"
  }
}
```

**Storage:**
- GlobalState.connections: Connection[]
- Only used in Mapping view
- Persisted to localStorage

### 5.3 Relationship

**Purpose:** Represents relationships between entities in Model view

**Location:** `lib/types.ts`

**Type Definition:**
```typescript
interface Relationship {
  id: string                                        // Unique ID (prefix: rel_)
  sourceEntityId: string                            // Source LogicalEntity ID
  targetEntityId: string                            // Target LogicalEntity ID
  label: string                                     // Optional label (empty string = no label)
  cardinality: "1:1" | "1:N" | "M:N"               // Basic cardinality
  
  // Extended precision (optional)
  minSource?: 0 | 1                                // Minimum on source side
  maxSource?: 1 | "N"                              // Maximum on source side
  minTarget?: 0 | 1                                // Minimum on target side
  maxTarget?: 1 | "N"                              // Maximum on target side
  direction?: "source-to-target" | "target-to-source" | "none"
}
```

**Cardinality Explanation:**

**Basic (cardinality field):**
- `1:1` - One-to-one
- `1:N` - One-to-many
- `M:N` - Many-to-many

**Extended (min/max fields):**
- `minSource: 0, maxSource: 1` = Optional one (0..1)
- `minSource: 1, maxSource: 1` = Mandatory one (1..1)
- `minSource: 0, maxSource: "N"` = Optional many (0..*)
- `minSource: 1, maxSource: "N"` = Mandatory many (1..*)

**Direction:**
- `source-to-target` - Arrow points to target
- `target-to-source` - Arrow points to source
- `none` - No arrow (bidirectional)

**Business Rules:**
- ✅ sourceEntityId and targetEntityId reference LogicalEntity IDs
- ✅ label is optional (empty string = no label shown)
- ✅ Extended min/max overrides basic cardinality
- ⚠️ No validation for self-relationships (entity → same entity)
- ⚠️ No validation for duplicate relationships

**Examples:**
```typescript
// Simple 1:N relationship
{
  id: "rel_cust_ord001",
  sourceEntityId: "lent_customer001",
  targetEntityId: "lent_order001",
  label: "places",
  cardinality: "1:N",
  direction: "source-to-target"
}

// Extended M:N relationship
{
  id: "rel_prod_cat001",
  sourceEntityId: "lent_product001",
  targetEntityId: "lent_category001",
  label: "belongs to",
  cardinality: "M:N",
  minSource: 1,
  maxSource: "N",
  minTarget: 1,
  maxTarget: "N"
}
```

**Storage:**
- GlobalState.modelRelationships: Relationship[]
- Only used in Model view
- Persisted to localStorage

---

## 6. Sources Domain

### 6.1 Overview

**Purpose:** Metadata about physical data sources (databases, tables, columns)

**Location:** `lib/source-types.ts`

**Storage:** Separate localStorage key: `infoMapperSourcesV1`

### 6.2 SourceSystem

**Type Definition:**
```typescript
interface SourceSystem {
  id: string      // Unique ID
  name: string    // System name (e.g., "HR", "CRM", "Finance")
}
```

**Examples:**
```typescript
{ id: "sys_hr_001", name: "HR" }
{ id: "sys_crm_001", name: "CRM" }
```

### 6.3 SourceDatabase

**Type Definition:**
```typescript
interface SourceDatabase {
  id: string        // Unique ID
  systemId: string  // FK to SourceSystem
  name: string      // Database name (e.g., "hrdta", "crmprod")
}
```

**Hierarchy:** System → Database

### 6.4 SourceSchema

**Type Definition:**
```typescript
interface SourceSchema {
  id: string          // Unique ID
  databaseId: string  // FK to SourceDatabase
  name: string        // Schema name (e.g., "dbo", "sales")
}
```

**Hierarchy:** System → Database → Schema

### 6.5 SourceObject

**Type Definition:**
```typescript
interface SourceObject {
  id: string                    // Unique ID
  schemaId: string              // FK to SourceSchema
  name: string                  // Table/view name
  objectType: "table" | "view"  // Object type
  columns: SourceColumn[]       // Array of columns
  rowCount?: number            // Optional row count
  comment?: string             // Optional comment
}
```

**Hierarchy:** System → Database → Schema → Object

### 6.6 SourceColumn

**Type Definition:**
```typescript
interface SourceColumn {
  id: string                     // Unique ID
  objectId: string               // FK to SourceObject
  name: string                   // Column name
  dataType: SourceColumnDataType // Data type details
  nullable: boolean              // Nullability
  isPrimaryKey?: boolean         // PK flag
  isForeignKey?: boolean         // FK flag
  defaultValue?: string          // Default value
  comment?: string               // Optional comment
}

interface SourceColumnDataType {
  base: string         // Base type (e.g., "varchar", "int", "decimal")
  length?: number      // For varchar(100)
  precision?: number   // For decimal(10,2)
  scale?: number       // For decimal(10,2)
}
```

**Hierarchy:** System → Database → Schema → Object → Column

**Mapping to Logical:**
- SourceColumn connects to LogicalAttribute via Connection (attribute-mapping)

---

## 7. State Management

### 7.1 GlobalState Structure

**Location:** `lib/store.ts`

```typescript
type GlobalState = {
  // Core Domain
  concepts: Concept[]
  logicalEntities: LogicalEntity[]
  logicalAttributes: LogicalAttribute[]
  
  // Requirements
  requirements: RequirementRow[]
  
  // Mapping View
  items: DiagramItem[]              // Positions in Mapping view
  connections: Connection[]         // Attribute mappings
  
  // Model View
  modelItems: DiagramItem[]         // Positions in Model view
  modelRelationships: Relationship[] // Entity relationships
  
  // Version
  version: number                   // Schema version (currently 1)
}
```

### 7.2 State Update Pattern

**All mutations go through commands:**
```typescript
// lib/commands.ts
export function addEntity(conceptId: string, name: string): LogicalEntity {
  const entity: LogicalEntity = { id: genLogicalEntityId(), conceptId, name, stereotype: "Object" }
  setObjectState((prev) => ({
    ...prev,
    logicalEntities: [...prev.logicalEntities, entity],
  }))
  return entity
}
```

**Command Pattern Benefits:**
- Single point of mutation
- Easy to add validation
- Easy to add undo/redo (future)
- Consistent state updates

### 7.3 Persistence

**Auto-save:** 600ms debounce after state change

**Storage Keys:**
- `infoMapperStateV1` - Main state (concepts, entities, attributes, requirements, items, connections, modelItems, modelRelationships)
- `infoMapperSourcesV1` - Sources metadata (separate)
- `objectTreeUIv1` - UI state (expanded nodes, filters)

**Merge Strategy:**
```typescript
const existing = localStorage.getItem(key) ? JSON.parse(...) : {}
const next = { ...existing, ...newState }
localStorage.setItem(key, JSON.stringify(next))
```

---

## 8. ID Generation

**Location:** `lib/id.ts`

### 8.1 ID Format

**Pattern:** `{prefix}_{timestamp}{random}`

**Components:**
- `timestamp` - Date.now().toString(36) (base36)
- `random` - Math.random().toString(36).slice(2, 10)

**Prefixes:**
| Entity | Prefix | Example |
|--------|--------|---------|
| Concept | `conc_` | `conc_lk3m4n5o6p` |
| LogicalEntity | `lent_` | `lent_lk3m7q8r9s` |
| LogicalAttribute | `latr_` | `latr_lk3mat1u2v` |
| Relationship | `rel_` | `rel_lk3mbw3x4y` |
| Connection | `conn_` | `conn_lk3mcy5z6a` |
| Requirement | `req_` | `req_lk3mdb7c8d` |
| DiagramItem | `item_` | `item_lk3mee9f0g` |

### 8.2 ID Properties

**Uniqueness:** Very high probability (timestamp + 8 random chars)
**Sortable:** Chronological (timestamp-based)
**Parseable:** Can extract type from prefix

**Utility:**
```typescript
parseIdType("lent_abc123") // returns "lent"
```

---

## 9. Data Relationships

### 9.1 Domain Hierarchy

```
Concept
  └── LogicalEntity (1:N)
        └── LogicalAttribute (1:N)
```

**Cascade Rules:**
- Delete Concept → deletes all LogicalEntities + their LogicalAttributes
- Delete LogicalEntity → deletes all LogicalAttributes

### 9.2 Cross-Domain Relationships

**Requirement ↔ Entity/Source:**
```
Requirement ←(Connection)→ LogicalEntity
Requirement ←(Connection)→ Source
```

**Entity ↔ Entity (Relationships):**
```
LogicalEntity ←(Relationship)→ LogicalEntity
```

**Entity ↔ Source (Mappings):**
```
LogicalAttribute ←(Connection)→ SourceColumn
```

### 9.3 Relationship Matrix

| From | To | Via | Cardinality |
|------|-----|-----|-------------|
| Concept | LogicalEntity | conceptId | 1:N |
| LogicalEntity | LogicalAttribute | entityId | 1:N |
| LogicalEntity | LogicalEntity | Relationship | M:N |
| LogicalAttribute | SourceColumn | Connection | M:N |
| Requirement | LogicalEntity | Connection | M:N |
| Requirement | Source | Connection | M:N |

---

## 10. Storage & Persistence

### 10.1 localStorage Structure

**Key: `infoMapperStateV1`**
```json
{
  "concepts": [...],
  "logicalEntities": [...],
  "logicalAttributes": [...],
  "requirements": [...],
  "items": [...],
  "connections": [...],
  "modelItems": [...],
  "modelRelationships": [...]
}
```

**Key: `infoMapperSourcesV1`**
```json
{
  "systems": [...],
  "databases": [...],
  "schemas": [...],
  "objects": [...]
}
```

**Key: `objectTreeUIv1`** (UI state)
```json
{
  "expandedConcepts": [...],
  "expandedEntities": [...],
  "filters": {...}
}
```

### 10.2 Import/Export

**Export Format:** JSON
**Import:** Validates with Zod schemas (in page.tsx)

---

## 11. Type Definitions Reference

### 11.1 Quick Reference Table

| Type | Location | Storage | View Usage |
|------|----------|---------|------------|
| Concept | types.ts | GlobalState.concepts | Object, Catalog |
| LogicalEntity | types.ts | GlobalState.logicalEntities | Object, Catalog |
| LogicalAttribute | types.ts | GlobalState.logicalAttributes | Object, Catalog |
| Entity | types.ts | Projected | Mapping, Model |
| Attribute | types.ts | Projected | Mapping, Model |
| RequirementRow | store.ts | GlobalState.requirements | Requirements |
| DiagramItem | types.ts | GlobalState.items / modelItems | Mapping, Model |
| Connection | types.ts | GlobalState.connections | Mapping |
| Relationship | types.ts | GlobalState.modelRelationships | Model |
| SourceSystem | source-types.ts | Separate storage | Sources |
| SourceDatabase | source-types.ts | Separate storage | Sources |
| SourceSchema | source-types.ts | Separate storage | Sources |
| SourceObject | source-types.ts | Separate storage | Sources |
| SourceColumn | source-types.ts | Separate storage | Sources |

### 11.2 Type Hierarchy Diagram

```
Domain Model (Source of Truth)
├── Concept
│   └── LogicalEntity
│       └── LogicalAttribute
│
├── RequirementRow
│
└── Sources (Separate Domain)
    └── SourceSystem
        └── SourceDatabase
            └── SourceSchema
                └── SourceObject
                    └── SourceColumn

Projection Layer
├── Entity (from LogicalEntity + LogicalAttribute)
└── Attribute (from LogicalAttribute)

UI Layer
├── DiagramItem (positions)
├── Connection (mappings)
└── Relationship (entity relationships)
```

---

## 12. Migration Guide

### 12.1 Current Schema Version: 1

**Future Migrations:**

When schema changes, increment `GlobalState.version` and provide migration function:

```typescript
function migrateState(state: any): GlobalState {
  if (state.version === 1) {
    // Migrate from v1 to v2
    return {
      ...state,
      // Add new fields
      version: 2
    }
  }
  return state
}
```

### 12.2 Known Technical Debt

**⚠️ Type Discrepancy:**
- `lib/types.ts` has `Requirement` with `priority` and `status`
- `lib/store.ts` has `RequirementRow` with `type` and `displayId`
- **Current:** Using RequirementRow
- **TODO:** Reconcile types or rename to avoid confusion

**⚠️ No Validation:**
- Duplicate names allowed (concepts, entities, attributes)
- Missing FK validation (entityId, conceptId)
- No orphan detection

**⚠️ No Referential Integrity:**
- Deleting entity doesn't update Connections
- Deleting attribute doesn't update Connections
- No cascade for DiagramItems

**⚠️ DisplayId Generation:**
- Random 6-digit number (not sequential)
- Possible collisions (low probability but possible)

---

## 13. Best Practices

### 13.1 Adding New Types

1. Define in `lib/types.ts` or relevant file
2. Add to GlobalState if persisted
3. Create command functions in `lib/commands.ts`
4. Update projections if needed
5. Add ID generator in `lib/id.ts`
6. Document in this file

### 13.2 Modifying Existing Types

1. Check all usages (search codebase)
2. Update type definition
3. Update commands
4. Update projections
5. Create migration if breaking change
6. Update this documentation

### 13.3 Testing Changes

1. Test in Object view (core domain)
2. Test in Mapping view (projections + connections)
3. Test in Model view (projections + relationships)
4. Test persistence (save/load)
5. Test import/export

---

## 14. Future Enhancements

### 14.1 Validation Layer

Add runtime validation:
- Unique name constraints
- FK existence checks
- Orphan detection
- Data type validation

### 14.2 Referential Integrity

Add cascade rules:
- Delete entity → remove related DiagramItems
- Delete attribute → remove related Connections
- Soft delete option

### 14.3 Versioning

Add proper versioning:
- Schema version tracking
- Migration functions
- Backward compatibility
- Export format versioning

### 14.4 Type Improvements

- Reconcile Requirement types
- Add enums for string literals
- Stricter type checking
- Zod schemas for all types

---

## Appendix A: File Locations

| File | Purpose |
|------|---------|
| `lib/types.ts` | Core type definitions |
| `lib/store.ts` | State management & RequirementRow type |
| `lib/source-types.ts` | Sources domain types |
| `lib/commands.ts` | State mutation commands |
| `lib/projections.ts` | View projection functions |
| `lib/id.ts` | ID generation utilities |
| `lib/utils.ts` | Utility functions (normalizeStereotype, etc.) |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Concept** | Top-level business domain grouping |
| **Logical Entity** | Business entity (what it represents) |
| **Physical Source** | Technical source (where data comes from) |
| **Projection** | Transformation of data for specific view |
| **DiagramItem** | Position and UI state on diagram |
| **Connection** | Mapping between logical and physical |
| **Relationship** | Association between logical entities |
| **Stereotype** | Entity classification (Object, Link, etc.) |
| **Cascade** | Automatic deletion of child records |
| **PII** | Personal Identifiable Information |

---

**End of Documentation**

For questions or updates, refer to this document as the single source of truth for InfoMapper's data model.

